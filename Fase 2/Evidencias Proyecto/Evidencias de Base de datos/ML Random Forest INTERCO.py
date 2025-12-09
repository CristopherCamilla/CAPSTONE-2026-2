#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
ml_proyeccion_ventas_6m_rf_mysql_v4_modificado.py
Predicción de ventas futuras (6 meses o más) usando Random Forest (modelo ML con estacionalidad mensual)
MODIFICADO para predecir VENTA TOTAL en lugar de VENTA POR ARTÍCULO para corregir la subestimación.

Autor: Cristopher 
"""

import warnings
import numpy as np
import pandas as pd
from dataclasses import dataclass
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy import create_engine
from urllib.parse import quote_plus


# ---------------- CONFIG ----------------
@dataclass
class Config:
    fuente: str = "sql"  # "sql" o "csv"
    sql_server: str = "192.168.1.133,1432"
    sql_database: str = "ModeloPredictivo"
    sql_user: str = "patatas"
    sql_password: str = "Patatas2024@"
    sql_driver: str = "ODBC Driver 17 for SQL Server"
    tabla_sql: str = "dbo.ventas"
    ruta_csv: str = "./datos/ventas.csv"
    horizonte_meses: int = 6
    # --- Conexión MySQL ---
    mysql_host: str = "192.168.1.133"
    mysql_db: str = "web"
    mysql_user: str = "patatas"
    mysql_pass: str = "Patatas2024@"
    tabla_mysql_total: str = "proyeccion_ventas_total"
    tabla_mysql_detalle: str = "proyeccion_ventas_detalle"

CFG = Config()


# ---------------- FUNCIONES ----------------
def leer_datos(cfg: Config) -> pd.DataFrame:
    """Lee datos desde SQL Server o CSV"""
    if cfg.fuente.lower() == "sql":
        import urllib
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={cfg.sql_server};"
            f"DATABASE={cfg.sql_database};"
            f"UID={cfg.sql_user};"
            f"PWD={cfg.sql_password};"
            f"TrustServerCertificate=yes;"
        )
        params = urllib.parse.quote_plus(conn_str)
        engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")
        query = f"""
        SELECT Fecha, TipoDocumento, Codigo, Genero, Categoria, SubCategoria,
               Cantidad, Nulas
        FROM {cfg.tabla_sql}
        WHERE Fecha >= '2021-01-01';
        """
        df = pd.read_sql(query, engine)
    else:
        df = pd.read_csv(cfg.ruta_csv)

    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    df["Fecha"] = pd.to_datetime(df["Fecha"], errors="coerce")
    df = df.dropna(subset=["Fecha"])
    df["Genero"] = df["Genero"].astype(str).str.upper().str.strip()
    df["Categoria"] = df["Categoria"].astype(str).str.upper().str.strip()
    df["SubCategoria"] = df["SubCategoria"].astype(str).str.upper().str.strip()
    df["Cantidad"] = pd.to_numeric(df["Cantidad"], errors="coerce").fillna(0)
    # Asume que 'Cantidad' es la cantidad de pares. Las NCV se restan o se suman según cómo esté el dato de origen.
    # Se mantiene la lógica original: si es NCV (Nota de Crédito por Venta) se resta, sino se suma.
    df["qty_signed"] = np.where(df["TipoDocumento"].astype(str).str.upper().str.strip() == "NCV", df["Cantidad"], df["Cantidad"])
    df = df[df["Nulas"].fillna(0) == 0]
    return df.reset_index(drop=True)


def preparar_datos(df: pd.DataFrame) -> pd.DataFrame:
    """Agrega ventas mensuales por Genero, Categoria, SubCategoria"""
    df["Periodo"] = df["Fecha"].dt.to_period("M")
    agg = (
        df.groupby(["Periodo", "Genero", "Categoria", "SubCategoria"], as_index=False)
          .agg(venta_total=("qty_signed", "sum"),
               articulos_en_linea=("Codigo", "nunique"))
    )
    agg["venta_x_articulo"] = agg["venta_total"] / agg["articulos_en_linea"].replace(0, np.nan)
    agg["Fecha"] = agg["Periodo"].dt.to_timestamp()
    agg = agg.fillna(0)
    # Se asegura que venta_total no sea negativa (ya que son pares)
    agg["venta_total"] = agg["venta_total"].clip(lower=0)
    return agg


def entrenar_y_predecir_rf(df: pd.DataFrame, cfg: Config):
    """
    Entrena Random Forest para predecir VENTA TOTAL,
    usando venta_x_articulo como feature de soporte.
    """
    resultados, pred_detalle = [], []

    for (genero, cat, subcat), grupo in df.groupby(["Genero", "Categoria", "SubCategoria"]):
        grupo = grupo.sort_values("Fecha")
        if len(grupo) < 6:
            continue

        # 🎯 CAMBIO 1: Incluir venta_total y venta_x_articulo en la serie
        serie = grupo[["Fecha", "venta_total", "venta_x_articulo"]].set_index("Fecha")

        # Agregar estacionalidad y lags
        data = serie.copy()
        data["mes"] = data.index.month
        data["año"] = data.index.year
        
        # 🎯 CAMBIO 2: Lags de la variable OBJETIVO (venta_total)
        data["lag_1_total"] = data["venta_total"].shift(1)
        data["lag_2_total"] = data["venta_total"].shift(2)
        data["lag_3_total"] = data["venta_total"].shift(3)
        
        # 🎯 CAMBIO 3: Lag de venta_x_articulo (como feature de soporte)
        data["lag_1_x_articulo"] = data["venta_x_articulo"].shift(1)
        
        data = data.dropna()

        # 🎯 CAMBIO 4: Definir la matriz X y la variable y
        X = data[["mes", "año", "lag_1_total", "lag_2_total", "lag_3_total", "lag_1_x_articulo"]]
        y = data["venta_total"] # <-- ¡La variable objetivo es la VENTA TOTAL!

        if len(X) < 5:
            continue

        modelo = RandomForestRegressor(n_estimators=300, random_state=42)
        modelo.fit(X, y)

        # --- Predicciones futuras ---
        ult_fecha = data.index.max()
        # Obtener los últimos lags para iniciar la predicción
        ult_lags_total = [data["lag_1_total"].iloc[-1], data["lag_2_total"].iloc[-1], data["lag_3_total"].iloc[-1]]
        ult_lag_x_articulo = data["lag_1_x_articulo"].iloc[-1]
        
        predicciones_total = [] # Se cambia el nombre para claridad
        fechas_futuras = []

        for i in range(cfg.horizonte_meses):
            nueva_fecha = ult_fecha + relativedelta(months=i + 1)
            mes = nueva_fecha.month
            año = nueva_fecha.year
            
            # Vector de predicción (debe coincidir con X)
            x_pred = np.array([[mes, año, 
                                ult_lags_total[0], ult_lags_total[1], ult_lags_total[2],
                                ult_lag_x_articulo]]) 
                                
            pred = modelo.predict(x_pred)[0]
            pred = max(pred, 0)  # Evitar valores negativos

            predicciones_total.append(pred)
            fechas_futuras.append(nueva_fecha)

            # 🎯 CAMBIO 5: Actualizar los lags con la PREDICCIÓN TOTAL
            ult_lags_total = [pred, ult_lags_total[0], ult_lags_total[1]]
            # El lag de venta_x_articulo se mantiene estático como heurística simple
            # ya que no podemos calcularlo sin la predicción de artículos en línea.


        # --- Aplicar el factor de realismo al total (si es necesario) ---
        # Se mantiene la lógica original, pero ahora se aplica al total proyectado.
        promedio_hist = y.mean() # Promedio de VENTA TOTAL histórica
        factor_realismo = 1.0 if np.mean(predicciones_total) < promedio_hist else 1.0
        predicciones_finales = [p * factor_realismo for p in predicciones_total]
        
        # --- Cálculo de totales ---
        articulos = grupo["articulos_en_linea"].max()
        venta_total_horizonte = np.sum(predicciones_finales) # Este es el total proyectado (ej. 400k)
        venta_prom_art = venta_total_horizonte / articulos if articulos > 0 else venta_total_horizonte

        id_linea = f"2_{genero}_{cat}_{subcat}"

        # Tabla Total
        resultados.append({
            "id_linea": id_linea,
            "empresa": 2, 
            "Color": 0,
            "Genero": genero,
            "Categoria": cat,
            "SubCategoria": subcat,
            "articulos_en_linea": int(articulos),
            "venta_prom_6m_estimada": round(int(venta_total_horizonte), 0), # Venta total proyectada
            "venta_prom_x_articulo_estimada": round(int(venta_prom_art), 0)
        })

        # Tabla Detalle
        for fecha, venta in zip(fechas_futuras, predicciones_finales):
            pred_detalle.append({
                "id_linea": id_linea,
                "empresa": 2,                
                "Color": 0,
                "Genero": genero,
                "Categoria": cat,
                "SubCategoria": subcat,
                "Mes": fecha.strftime("%Y-%m"),
                "venta_mes_estimada": round(float(venta), 0) # Venta TOTAL mensual proyectada
            })

    return pd.DataFrame(resultados), pd.DataFrame(pred_detalle)


def guardar_en_mysql(df_total, df_detalle, cfg):
    """Guarda los DataFrames directamente en MySQL con fecha_proyeccion"""
    print("Conectando a MySQL...")
    pwd = quote_plus(cfg.mysql_pass)
    # Asegúrate de tener instalado 'pymysql' si no lo tienes: pip install pymysql
    engine = create_engine(f"mysql+pymysql://{cfg.mysql_user}:{pwd}@{cfg.mysql_host}/{cfg.mysql_db}?charset=utf8mb4")

    fecha_proyeccion = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    df_total["fecha_proyeccion"] = fecha_proyeccion
    df_detalle["fecha_proyeccion"] = fecha_proyeccion

    df_total.to_sql(cfg.tabla_mysql_total, con=engine, if_exists='append', index=False)
    df_detalle.to_sql(cfg.tabla_mysql_detalle, con=engine, if_exists='append', index=False)

    print(f"✅ Datos guardados en MySQL con fecha_proyeccion = {fecha_proyeccion}")


# ---------------- MAIN ----------------
def main():
    warnings.filterwarnings("ignore")
    print("Leyendo datos...")
    df = leer_datos(CFG)
    print(f"Registros leídos: {len(df):,}")

    print("Preparando datos mensuales...")
    dfm = preparar_datos(df)

    print("Entrenando Random Forest y proyectando meses futuros...")
    resumen, detalle = entrenar_y_predecir_rf(dfm, CFG)

    guardar_en_mysql(resumen, detalle, CFG)
    print("🎯 Predicciones guardadas exitosamente en MySQL con fecha_proyeccion incluida.")


if __name__ == "__main__":
    main()
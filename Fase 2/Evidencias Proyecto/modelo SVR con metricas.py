#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
ml_proyeccion_optimizada_svr.py

Predicción de ventas con SVR (Support Vector Regression) + Cross Validation.
MEJORAS APLICADAS:
1. Modelo: Cambio de XGBoost a SVR (Support Vector Regression).
2. Limpieza de texto (eliminación de dígitos y nulos).
3. Transformación Logarítmica + Escalado de Datos + Factor de Ajuste.
"""

import warnings
import numpy as np
import pandas as pd
from dataclasses import dataclass
from datetime import datetime
from dateutil.relativedelta import relativedelta

# Librerías de Machine Learning
# --- CAMBIO IMPORTANTE: Importamos SVR y StandardScaler ---
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Librerías de Base de Datos
from sqlalchemy import create_engine
from urllib.parse import quote_plus

# ---------------- CONFIGURACIÓN ----------------
@dataclass
class Config:
    # --- Parámetros del Modelo ---
    horizonte_meses: int = 6
    min_datos_entrenamiento: int = 12  # SVR también requiere un historial decente
    
    # --- SQL Server (Lectura) ---
    sql_server: str = "192.168.1.133,1432"
    sql_database: str = "ModeloPredictivo"
    sql_user: str = "patatas"
    sql_password: str = "Patatas2024@"
    tabla_sql: str = "dbo.ventas"
    
    # --- MySQL (Escritura) ---
    mysql_host: str = "192.168.1.133"
    mysql_db: str = "web"
    mysql_user: str = "patatas"
    mysql_pass: str = "Patatas2024@"
    tabla_mysql_total: str = "proyeccion_ventas_total"
    tabla_mysql_detalle: str = "proyeccion_ventas_detalle"

CFG = Config()

# ---------------- FUNCIONES DE BASE DE DATOS ----------------

def obtener_engine_sql(cfg: Config):
    """Crea conexión a SQL Server"""
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={cfg.sql_server};"
        f"DATABASE={cfg.sql_database};"
        f"UID={cfg.sql_user};"
        f"PWD={cfg.sql_password};"
        f"TrustServerCertificate=yes;"
    )
    params = quote_plus(conn_str)
    return create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

def obtener_engine_mysql(cfg: Config):
    """Crea conexión a MySQL"""
    pwd = quote_plus(cfg.mysql_pass)
    return create_engine(f"mysql+pymysql://{cfg.mysql_user}:{pwd}@{cfg.mysql_host}/{cfg.mysql_db}?charset=utf8mb4")

def leer_datos(cfg: Config) -> pd.DataFrame:
    """Lee datos transaccionales desde SQL Server y limpia texto"""
    print("🔌 Conectando a SQL Server...")
    engine = obtener_engine_sql(cfg)
    
    query = f"""
    SELECT Fecha, TipoDocumento, Codigo, Genero, Categoria, SubCategoria,
           Cantidad, Nulas
    FROM {cfg.tabla_sql}
    WHERE Fecha >= '2021-01-01';
    """
    try:
        df = pd.read_sql(query, engine)
    except Exception as e:
        print(f"❌ Error leyendo SQL Server: {e}")
        return pd.DataFrame()

    # --- LIMPIEZA DATOS
    df.columns = [c.strip().replace(" ", "_") for c in df.columns]
    df["Fecha"] = pd.to_datetime(df["Fecha"], errors="coerce")
    df = df.dropna(subset=["Fecha"])

    cols_txt = ["Genero", "Categoria", "SubCategoria"]
    
    print("🧹 Limpiando números y nulos en columnas de texto...")
    
    for col in cols_txt:
        df[col] = df[col].astype(str)
        # Eliminar dígitos
        df[col] = df[col].str.replace(r'\d+', '', regex=True)
        # Limpiar espacios
        df[col] = df[col].str.strip().str.upper()
        # Nulos reales
        df[col] = df[col].replace(["", "NAN", "NONE", "NULL"], np.nan)

    # Eliminar nulos
    df = df.dropna(subset=cols_txt)

    # --- CONTINUAR PROCESO NORMAL ---
    df["TipoDocumento"] = df["TipoDocumento"].astype(str).str.upper().str.strip()
        
    df["Cantidad"] = pd.to_numeric(df["Cantidad"], errors="coerce").fillna(0)

    # Lógica NCV
    df["qty_signed"] = np.where(df["TipoDocumento"] == "NCV", df["Cantidad"], df["Cantidad"])
    
    # Filtrar anuladas
    df = df[df["Nulas"].fillna(0) == 0]
    
    print(f"✅ Registros limpios y listos: {len(df):,}")
    return df.reset_index(drop=True)

# ---------------- PREPARACIÓN DE DATOS ----------------

def preparar_datos_mensuales(df: pd.DataFrame) -> pd.DataFrame:
    """Agrupa ventas por Mes, Genero, Categoria, SubCategoria"""
    df["Periodo"] = df["Fecha"].dt.to_period("M")
    agg = (
        df.groupby(["Periodo", "Genero", "Categoria", "SubCategoria"], as_index=False)
          .agg(venta_total=("qty_signed", "sum"),
               articulos_en_linea=("Codigo", "nunique"))
    )
    
    agg["venta_x_articulo"] = agg["venta_total"] / agg["articulos_en_linea"].replace(0, np.nan)
    agg["Fecha"] = agg["Periodo"].dt.to_timestamp()
    agg = agg.fillna(0)
    agg["venta_total"] = agg["venta_total"].clip(lower=0)
    
    return agg.sort_values(["Genero", "Categoria", "SubCategoria", "Fecha"])

# ---------------- MOTOR DE MACHINE LEARNING (SVR) ----------------

def entrenar_optimizar_predecir(df: pd.DataFrame, cfg: Config):
    """
    Recorre cada grupo, optimiza hiperparámetros SVR y aplica corrección de volumen.
    """
    resultados_total = []
    resultados_detalle = []
    metricas_modelo = []
    
    grupos = df.groupby(["Genero", "Categoria", "SubCategoria"])
    total_grupos = grupos.ngroups
    print(f"🚀 Iniciando SVR en {total_grupos} grupos...")
    
    contador = 0
    
    for (genero, cat, subcat), grupo in grupos:
        contador += 1
        grupo = grupo.sort_values("Fecha")
        
        # 1. Filtro de datos mínimos
        if len(grupo) < cfg.min_datos_entrenamiento:
            continue

        # 2. Feature Engineering
        serie = grupo[["Fecha", "venta_total", "venta_x_articulo"]].set_index("Fecha")
        data = serie.copy()
        data["mes"] = data.index.month
        data["año"] = data.index.year
        
        data["lag_1_total"] = data["venta_total"].shift(1)
        data["lag_2_total"] = data["venta_total"].shift(2)
        data["lag_3_total"] = data["venta_total"].shift(3)
        data["lag_1_x_articulo"] = data["venta_x_articulo"].shift(1)
        
        data = data.dropna()
        
        if len(data) < 6:
            continue

        X = data[["mes", "año", "lag_1_total", "lag_2_total", "lag_3_total", "lag_1_x_articulo"]]
        
        # LOG TRANSFORMATION
        y = np.log1p(data["venta_total"]) 

        # --- PREPARACIÓN SVR: ESCALADO ---
        # SVR necesita features escaladas para funcionar correctamente
        scaler = StandardScaler()
        try:
            X_scaled = scaler.fit_transform(X)
        except ValueError:
            continue

        # 3. Optimización SVR
        modelo_base = SVR()
        
        # Grilla específica para SVR
        param_grid = {
            "kernel": ["rbf", "linear"],
            "C": [0.1, 1, 10, 100],        # Penalización
            "gamma": ["scale", 0.01, 0.1], # Coeficiente para kernel (solo rbf)
            "epsilon": [0.01, 0.1, 0.5]    # Margen de tolerancia
        }
        
        tscv = TimeSeriesSplit(n_splits=3)
        
        try:
            buscador = RandomizedSearchCV(
                modelo_base,
                param_grid,
                n_iter=10,
                cv=tscv,
                scoring="neg_mean_absolute_error",
                n_jobs=-1,
                random_state=42,
                verbose=0
            )
            buscador.fit(X_scaled, y)
            best_model = buscador.best_estimator_
            
        except Exception:
            # Fallback simple
            best_model = SVR(kernel='rbf', C=10, epsilon=0.1)
            best_model.fit(X_scaled, y)

        # 4. Cálculo de Métricas y FACTOR DE AJUSTE DE VOLUMEN
        # Predicción histórica en Log (usando datos escalados)
        preds_log = best_model.predict(X_scaled)
        
        # Revertir a Real
        preds_reales = np.expm1(preds_log)
        preds_reales = np.maximum(preds_reales, 0)
        
        y_real = data["venta_total"]

        # --- CORRECCIÓN DE VOLUMEN INTELIGENTE ---
        # Calculamos cuánto subestimó el logaritmo
        volumen_real_hist = np.sum(y_real)
        volumen_pred_hist = np.sum(preds_reales)
        
        factor_ajuste = 1.0
        if volumen_pred_hist > 0:
            factor_ajuste = volumen_real_hist / volumen_pred_hist
            
        # Límite de seguridad
        factor_ajuste = min(factor_ajuste, 3.0) 
        factor_ajuste = max(factor_ajuste, 0.5)

        # Métricas Ajustadas
        preds_finales_hist = preds_reales * factor_ajuste

        mae = mean_absolute_error(y_real, preds_finales_hist)
        rmse = np.sqrt(mean_squared_error(y_real, preds_finales_hist))
        r2 = r2_score(y_real, preds_finales_hist)
        
        mask = y_real != 0
        mape = np.mean(np.abs((y_real[mask] - preds_finales_hist[mask]) / y_real[mask])) * 100 if np.sum(mask) > 0 else 0

        metricas_modelo.append({
            "Genero": genero,
            "Categoria": cat,
            "SubCategoria": subcat,
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "MAPE_%": round(mape, 2),
            "R2": round(r2, 4),
            "Datos_Historicos": len(data),
            "Factor_Ajuste": round(factor_ajuste, 2)
        })

        # 5. Proyección Futura
        ult_fecha = data.index.max()
        ult_lags_total = [data["lag_1_total"].iloc[-1], data["lag_2_total"].iloc[-1], data["lag_3_total"].iloc[-1]]
        ult_lag_x_articulo = data["lag_1_x_articulo"].iloc[-1]
        
        predicciones_futuras = []
        fechas_futuras = []
        lags_temp = ult_lags_total.copy()

        for i in range(cfg.horizonte_meses):
            nueva_fecha = ult_fecha + relativedelta(months=i + 1)
            
            x_pred_raw = np.array([[
                nueva_fecha.month, 
                nueva_fecha.year, 
                lags_temp[0], lags_temp[1], lags_temp[2],
                ult_lag_x_articulo
            ]])
            
            # ESCALAR la entrada futura con el MISMO scaler entrenado
            x_pred_scaled = scaler.transform(x_pred_raw)
            
            # Predicción Log
            pred_log = best_model.predict(x_pred_scaled)[0]
            
            # Revertir Log y APLICAR FACTOR
            pred_real = np.expm1(pred_log) * factor_ajuste
            pred_real = max(pred_real, 0)
            
            predicciones_futuras.append(pred_real)
            fechas_futuras.append(nueva_fecha)
            
            # Actualizar Lags con el valor real proyectado
            lags_temp = [pred_real, lags_temp[0], lags_temp[1]]

        # 6. Preparar Resultados
        articulos = grupo["articulos_en_linea"].max()
        venta_total_horizonte = np.sum(predicciones_futuras)
        venta_prom_art = venta_total_horizonte / articulos if articulos > 0 else venta_total_horizonte
        id_linea = f"2_{genero}_{cat}_{subcat}"

        resultados_total.append({
            "id_linea": id_linea,
            "empresa": 2, 
            "Color": 0,
            "Genero": genero,
            "Categoria": cat,
            "SubCategoria": subcat,
            "articulos_en_linea": int(articulos),
            "venta_prom_6m_estimada": round(int(venta_total_horizonte), 0),
            "venta_prom_x_articulo_estimada": round(int(venta_prom_art), 0),
        })

        for fecha, venta in zip(fechas_futuras, predicciones_futuras):
            resultados_detalle.append({
                "id_linea": id_linea,
                "empresa": 2,                
                "Color": 0,
                "Genero": genero,
                "Categoria": cat,
                "SubCategoria": subcat,
                "Mes": fecha.strftime("%Y-%m"),
                "venta_mes_estimada": round(float(venta), 0)
            })
            
        if contador % 20 == 0:
            print(f"   ... Procesados {contador} grupos")

    return pd.DataFrame(resultados_total), pd.DataFrame(resultados_detalle), pd.DataFrame(metricas_modelo)

def guardar_resultados(df_total, df_detalle, df_metricas, cfg: Config):
    """Guarda predicciones en MySQL y métricas en CSV"""
    
    if not df_total.empty:
        print("💾 Guardando predicciones en MySQL...")
        engine_mysql = obtener_engine_mysql(cfg)
        
        fecha_proyeccion = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        df_total["fecha_proyeccion"] = fecha_proyeccion
        df_detalle["fecha_proyeccion"] = fecha_proyeccion
        
        try:
            df_total.to_sql(cfg.tabla_mysql_total, con=engine_mysql, if_exists='append', index=False)
            df_detalle.to_sql(cfg.tabla_mysql_detalle, con=engine_mysql, if_exists='append', index=False)
            print("✅ Datos guardados en MySQL correctamente.")
        except Exception as e:
            print(f"❌ Error escribiendo en MySQL: {e}")
    else:
        print("⚠️ No se generaron predicciones para guardar.")

    if not df_metricas.empty:
        archivo_metricas = "reporte_metricas_svr.csv"
        df_metricas.to_csv(archivo_metricas, index=False)
        print(f"📊 Reporte de métricas (MAE, MAPE, R2) guardado en: {archivo_metricas}")
        
        print("\n--- TOP 10 MODELOS MÁS PRECISOS (Menor MAPE) ---")
        print(df_metricas.sort_values("MAPE_%").head(60))

# ---------------- MAIN ----------------
def main():
    warnings.filterwarnings("ignore")
    
    # 1. Leer Datos
    df = leer_datos(CFG)
    if df.empty:
        return

    # 2. Preparar
    print("Preparando datos mensuales...")
    dfm = preparar_datos_mensuales(df)

    # 3. Entrenar y Predecir (SVR)
    resumen, detalle, metricas = entrenar_optimizar_predecir(dfm, CFG)

    # 4. Guardar
    guardar_resultados(resumen, detalle, metricas, CFG)
    
    print("\n🎯 Proceso SVR Finalizado.")

if __name__ == "__main__":
    main()
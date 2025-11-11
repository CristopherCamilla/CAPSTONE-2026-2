#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
analisis_proyecciones.py
Carga ventas reales 2025 (SQL Server) y proyecciones 2025 (MySQL).
Compara los resúmenes por Genero, Categoria, SubCategoria.
Calcula y explica MAE, RMSE, MAPE a nivel global y desagregado, 
proporcionando conclusiones.

Autor: Gemini
"""

import warnings
import numpy as np
import pandas as pd
from dataclasses import dataclass
from sqlalchemy import create_engine
from urllib.parse import quote_plus
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# --- CONFIGURACIÓN ---
@dataclass
class Config:
    # --- Conexión SQL Server (Para datos reales) ---
    sql_server: str = "192.168.1.133,1432" # <<-- CORREGIDO TU IP: 192.168.1.133
    sql_database: str = "ModeloPredictivo"
    sql_user: str = "patatas"
    sql_password: str = "Patatas2024@"
    sql_driver: str = "ODBC Driver 17 for SQL Server"
    tabla_sql_ventas: str = "dbo.ventas"
    
    # --- Conexión MySQL (Para proyecciones) ---
    mysql_host: str = "192.168.1.133" # <<-- CORREGIDO TU IP: 192.168.1.133
    mysql_db: str = "web"
    mysql_user: str = "patatas"
    mysql_pass: str = "Patatas2024@"
    tabla_mysql_detalle: str = "proyeccion_ventas_detalle"
    
CFG = Config()

# ---------------- FUNCIONES DE CONEXIÓN Y LECTURA ----------------

def get_sql_server_engine(cfg: Config):
    """Crea y devuelve el motor de conexión a SQL Server."""
    import urllib
    conn_str = (
        f"DRIVER={{{cfg.sql_driver}}};"
        f"SERVER={cfg.sql_server};"
        f"DATABASE={cfg.sql_database};"
        f"UID={cfg.sql_user};"
        f"PWD={cfg.sql_password};"
        f"TrustServerCertificate=yes;" # Necesario si no tienes un certificado CA en el cliente
    )
    params = urllib.parse.quote_plus(conn_str)
    return create_engine(f"mssql+pyodbc:///?odbc_connect={params}")


def get_mysql_engine(cfg: Config):
    """Crea y devuelve el motor de conexión a MySQL."""
    pwd = quote_plus(cfg.mysql_pass)
    return create_engine(f"mysql+pymysql://{cfg.mysql_user}:{pwd}@{cfg.mysql_host}/{cfg.mysql_db}?charset=utf8mb4")


def leer_ventas_reales_2025(cfg: Config) -> pd.DataFrame:
    """Lee y agrega las ventas reales de 2025 de SQL Server."""
    print("Conectando a SQL Server para obtener datos reales de 2025...")
    engine_sql = get_sql_server_engine(cfg)
    
    query_real = f"""
    SELECT 
        Fecha, TipoDocumento, Genero, Categoria, SubCategoria, Cantidad, Nulas
    FROM {cfg.tabla_sql_ventas}
    WHERE Fecha >= '2025-01-01' AND Fecha < '2025-07-01'
    """
    df_real = pd.read_sql(query_real, engine_sql)

    df_real["Fecha"] = pd.to_datetime(df_real["Fecha"])
    df_real["Genero"] = df_real["Genero"].astype(str).str.upper().str.strip()
    df_real["Categoria"] = df_real["Categoria"].astype(str).str.upper().str.strip()
    df_real["SubCategoria"] = df_real["SubCategoria"].astype(str).str.upper().str.strip()
    df_real["Cantidad"] = pd.to_numeric(df_real["Cantidad"], errors="coerce").fillna(0)
    df_real["qty_signed"] = np.where(
        df_real["TipoDocumento"].astype(str).str.upper().str.strip() == "NCV", 
        -df_real["Cantidad"], 
        df_real["Cantidad"]
    )
    df_real = df_real[df_real["Nulas"].fillna(0) == 0]
    
    df_real["Mes"] = df_real["Fecha"].dt.to_period("M").astype(str) # Convertir a string 'YYYY-MM'
    agg_real = (
        df_real.groupby(["Mes", "Genero", "Categoria", "SubCategoria"], as_index=False)
        .agg(venta_real=("qty_signed", "sum"))
    )
    agg_real = agg_real[agg_real["venta_real"] >= 0]
    
    print(f"✅ Cargadas {len(agg_real):,} filas de ventas reales de 2025.")
    return agg_real[["Mes", "Genero", "Categoria", "SubCategoria", "venta_real"]]


def leer_proyecciones_2025(cfg: Config) -> pd.DataFrame:
    """Lee las proyecciones más recientes de 2025 de MySQL."""
    print("Conectando a MySQL para obtener proyecciones de 2025...")
    engine_mysql = get_mysql_engine(cfg)
    
    query_max_date = f"SELECT MAX(fecha_proyeccion) FROM {cfg.tabla_mysql_detalle};"
    ultima_fecha = pd.read_sql(query_max_date, engine_mysql).iloc[0, 0]
    
    if ultima_fecha is None:
        raise Exception("No se encontraron proyecciones en la tabla 'proyeccion_ventas_detalle'.")

    print(f"Usando la última proyección con fecha: {ultima_fecha}")
    
    query_proj = f"""
    SELECT 
        Mes, Genero, Categoria, SubCategoria, venta_mes_estimada AS venta_proyectada
    FROM {cfg.tabla_mysql_detalle}
    WHERE fecha_proyeccion = '{ultima_fecha}'
      AND Mes >= '2025-01' AND Mes < '2026-01'
    """
    df_proj = pd.read_sql(query_proj, engine_mysql)
    
    for col in ["Genero", "Categoria", "SubCategoria"]:
        df_proj[col] = df_proj[col].astype(str).str.upper().str.strip()
        
    print(f"✅ Cargadas {len(df_proj):,} filas de proyecciones de 2025.")
    return df_proj


# ---------------- FUNCIONES DE CÁLCULO DE MÉTRICAS ----------------

def calculate_mape(y_true, y_pred):
    """Calcula el Mean Absolute Percentage Error (MAPE)."""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    non_zero_indices = y_true > 0
    if np.sum(non_zero_indices) == 0:
        return np.nan # Evitar divisiones por cero si no hay ventas reales

    return np.mean(np.abs((y_true[non_zero_indices] - y_pred[non_zero_indices]) / y_true[non_zero_indices])) * 100

def get_metrics_summary(df: pd.DataFrame, group_cols=None) -> pd.DataFrame:
    """
    Calcula MAE, RMSE, MAPE y R2 para un DataFrame.
    Puede agrupar por columnas si se especifican.
    """
    if group_cols:
        summary = df.groupby(group_cols).apply(
            lambda x: pd.Series({
                'MAE': mean_absolute_error(x['venta_real'], x['venta_proyectada']),
                'RMSE': np.sqrt(mean_squared_error(x['venta_real'], x['venta_proyectada'])),
                'MAPE': calculate_mape(x['venta_real'], x['venta_proyectada']),
                'R2': r2_score(x['venta_real'], x['venta_proyectada']),
                'Venta_Real_Total': x['venta_real'].sum(),
                'Venta_Proyectada_Total': x['venta_proyectada'].sum()
            })
        ).reset_index()
    else:
        summary = pd.DataFrame([{
            'MAE': mean_absolute_error(df['venta_real'], df['venta_proyectada']),
            'RMSE': np.sqrt(mean_squared_error(df['venta_real'], df['venta_proyectada'])),
            'MAPE': calculate_mape(df['venta_real'], df['venta_proyectada']),
            'R2': r2_score(df['venta_real'], df['venta_proyectada']),
            'Venta_Real_Total': df['venta_real'].sum(),
            'Venta_Proyectada_Total': df['venta_proyectada'].sum()
        }])
        
    # Formatear los resultados
    for col in ['MAE', 'RMSE', 'Venta_Real_Total', 'Venta_Proyectada_Total']:
        if col in summary.columns:
            summary[col] = summary[col].round(0).astype(int)
    for col in ['MAPE']:
        if col in summary.columns:
            summary[col] = summary[col].round(2)
    for col in ['R2']:
        if col in summary.columns:
            summary[col] = summary[col].round(4)
            
    return summary


# ---------------- FUNCIÓN PRINCIPAL ----------------

def main():
    warnings.filterwarnings("ignore")
    print("Iniciando análisis de proyecciones 2025...")
    try:
        # 1. Cargar datos
        df_real_2025 = leer_ventas_reales_2025(CFG)
        df_proj_2025 = leer_proyecciones_2025(CFG)
        
        # 2. Unir DataFrames
        print("\nCombinando datos de ventas reales y proyecciones...")
        df_comparacion = pd.merge(
            df_real_2025, df_proj_2025, 
            on=["Mes", "Genero", "Categoria", "SubCategoria"], 
            how="inner"
        )
        
        if df_comparacion.empty:
            print("🛑 ADVERTENCIA: No hay datos coincidentes de ventas reales y proyecciones para 2025. No se puede realizar el análisis.")
            return

        print(f"✅ Se obtuvieron {len(df_comparacion):,} registros coincidentes para el análisis.")
        
        # 3. Resumen y Comparación
        print("\n--- Resumen de Comparación (Venta Real vs Proyectada) ---")
        summary_global = df_comparacion[['venta_real', 'venta_proyectada']].sum()
        print(f"Venta Real Total 2025: {summary_global['venta_real']:,.0f}")
        print(f"Venta Proyectada Total 2025: {summary_global['venta_proyectada']:,.0f}")
        print(f"Diferencia: {summary_global['venta_proyectada'] - summary_global['venta_real']:,.0f}")
        print(f"Porcentaje de Error Total: {((summary_global['venta_proyectada'] - summary_global['venta_real']) / summary_global['venta_real'] * 100):.2f}%\n")

        print("--- Resumen por Género ---")
        summary_genero = df_comparacion.groupby('Genero').agg(
            venta_real_total=('venta_real', 'sum'),
            venta_proyectada_total=('venta_proyectada', 'sum')
        ).round(0).astype(int)
        print(summary_genero)
        print("\n--- Resumen por Categoría ---")
        summary_categoria = df_comparacion.groupby('Categoria').agg(
            venta_real_total=('venta_real', 'sum'),
            venta_proyectada_total=('venta_proyectada', 'sum')
        ).round(0).astype(int)
        print(summary_categoria)
        print("\n--- Resumen por SubCategoría (Top 10) ---")
        summary_subcategoria = df_comparacion.groupby('SubCategoria').agg(
            venta_real_total=('venta_real', 'sum'),
            venta_proyectada_total=('venta_proyectada', 'sum')
        ).round(0).astype(int).sort_values(by='venta_real_total', ascending=False).head(10)
        print(summary_subcategoria)

        # 4. Cálculo de Métricas
        print("\n--- CÁLCULO DE MÉTRICAS ---")
        print("\n")

        # Métricas Globales
        print("📊 Métricas Globales (Todo 2025):")
        global_metrics = get_metrics_summary(df_comparacion)
        print(global_metrics.to_string(index=False))

        # Métricas por Género
        print("\n📊 Métricas por Género:")
        genero_metrics = get_metrics_summary(df_comparacion, group_cols=['Genero'])
        print(genero_metrics.to_string(index=False))

        # Métricas por Categoría
        print("\n📊 Métricas por Categoría:")
        categoria_metrics = get_metrics_summary(df_comparacion, group_cols=['Categoria'])
        print(categoria_metrics.to_string(index=False))

        # Métricas por SubCategoría (Top 5 con mayor venta real)
        print("\n📊 Métricas por SubCategoría (Top 5 por Venta Real):")
        subcategoria_metrics = get_metrics_summary(df_comparacion, group_cols=['SubCategoria'])
        subcategoria_metrics = subcategoria_metrics.sort_values(by='Venta_Real_Total', ascending=False).head(5)
        print(subcategoria_metrics.to_string(index=False))
        
        # 5. Explicación de Métricas y Conclusiones
        print("\n--- EXPLICACIÓN DE MÉTRICAS Y CONCLUSIONES ---")
        print("\n**MAE (Mean Absolute Error - Error Absoluto Medio):**")
        print("  Indica la magnitud promedio de los errores en las unidades de la venta (pares).")
        print("  Un MAE de 50 significa que, en promedio, la proyección se desvía en 50 pares del valor real.")
        
        print("\n**RMSE (Root Mean Squared Error - Raíz del Error Cuadrático Medio):**")
        print("  Es similar al MAE pero penaliza más los errores grandes al elevarlos al cuadrado.")
        print("  Suele ser mayor que el MAE y es más sensible a grandes desviaciones. También en unidades de venta.")

        print("\n**MAPE (Mean Absolute Percentage Error - Error Porcentual Absoluto Medio):**")
        print("  Representa el error promedio en porcentaje. Es muy intuitivo y fácil de entender.")
        print("  Un MAPE del 10% significa que la proyección está, en promedio, un 10% desviada del valor real.")
        print("  Es la métrica preferida en forecasting cuando se necesita una perspectiva relativa del error.")
        
        print("\n**R2 (Coeficiente de Determinación):**")
        print("  Indica la proporción de la varianza en la variable real que puede ser explicada por el modelo.")
        print("  Valores cercanos a 1.0 sugieren que el modelo explica bien las variaciones. Un valor bajo (cercano a 0) indica que el modelo no explica mucha varianza.")

        print("\n--- CONCLUSIONES ---")
        print(f"\nEl modelo ha proyectado un total de {global_metrics['Venta_Proyectada_Total'].iloc[0]:,.0f} pares, frente a una venta real de {global_metrics['Venta_Real_Total'].iloc[0]:,.0f}.")
        print(f"El error absoluto promedio (MAE) es de {global_metrics['MAE'].iloc[0]:,.0f} pares, y el error porcentual promedio (MAPE) es del {global_metrics['MAPE'].iloc[0]:.2f}%.")
        print(f"El R-cuadrado global es de {global_metrics['R2'].iloc[0]:.4f}, indicando que el modelo explica aproximadamente el {global_metrics['R2'].iloc[0]*100:.2f}% de la variabilidad en las ventas totales.")
        
        print("\n**Análisis por Segmento (Género, Categoría, SubCategoría):**")
        print("  - Identifique los segmentos (filas en las tablas anteriores) con los MAE o MAPE más altos.")
        print("    Estos son los segmentos donde el modelo tiene mayor dificultad para predecir con precisión.")
        print("    Por ejemplo, si 'MUJER' tiene un MAPE mucho mayor que 'HOMBRE', investigaría los datos y el modelo para ese género.")
        print("  - Observe también los R2. Un R2 bajo en un segmento específico (por ejemplo, una SubCategoría pequeña)")
        print("    sugiere que el modelo no está capturando bien los patrones de ventas para ese segmento.")
        print("  - Compare 'Venta_Real_Total' y 'Venta_Proyectada_Total' para ver si el modelo está subestimando o sobrestimando consistentemente en ciertos segmentos.")
        
        print("\n**Próximos Pasos Sugeridos:**")
        print("  1. **Investigar Errores Altos:** Profundizar en los segmentos con peores métricas. ¿Hay eventos atípicos?")
        print("  2. **Análisis de Lags:** Si un segmento tiene pocos datos históricos, los lags podrían no ser representativos.")
        print("  3. **Características Adicionales:** Considerar si hay otras variables (días festivos, promociones, factores externos) que puedan mejorar la predicción en segmentos problemáticos.")
        print("  4. **Optimización del Modelo:** Evaluar si ajustar hiperparámetros de Random Forest o probar otros modelos (como Prophet, ARIMA para series de tiempo) podría mejorar el rendimiento, especialmente en segmentos volátiles.")
        print("  5. **Frecuencia de Reentrenamiento:** Asegurarse de que el modelo se reentrene regularmente con los datos más recientes.")

    except Exception as e:
        print(f"❌ Ocurrió un error en la ejecución: {e}")
        print("Asegúrate de que las bases de datos estén accesibles, las tablas existan y las credenciales sean correctas.")
        print("Verifica también que las direcciones IP de las bases de datos sean correctas en la configuración.")

if __name__ == "__main__":
    main()
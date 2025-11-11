import pandas as pd
import pyodbc
from sqlalchemy import create_engine

# -----------------------------------
# CONEXIoN A SQL SERVER (Interco)
# -----------------------------------
server_sqlserver = '192.168.1.130,1433'  
database_sqlserver = 'ARISTO2013'  
username_sqlserver = 'ARISTO2013'
password_sqlserver = 'HIRMAS550'

conn_str_sqlserver = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={server_sqlserver};"
    f"DATABASE={database_sqlserver};"
    f"UID={username_sqlserver};"
    f"PWD={password_sqlserver};"
    f"TrustServerCertificate=yes;"
)
conn_sqlserver = pyodbc.connect(conn_str_sqlserver)

# Consulta que agrupa codigo y color
query = """
SELECT
    LEFT(KOPR, 3) + '_' + SUBSTRING(KOPR, 4, 2) AS codigo_color,
    SUM(STFI1) AS stock
FROM dbo.MAEST
GROUP BY
    LEFT(KOPR, 3) + '_' + SUBSTRING(KOPR, 4, 2);
"""

df = pd.read_sql(query, conn_sqlserver)
print(" Datos le�dos desde SQL Server:")
print(df.head())

# -----------------------------------
# CONEXIoN A MYSQL
# -----------------------------------
host_mysql = '192.168.1.133'
port_mysql = 3306  
database_mysql = 'web'
username_mysql = 'patatas'
password_mysql = 'Patatas2024@'

# Crear motor SQLAlchemy
engine_mysql = create_engine(
   # f"mysql+pymysql://{username_mysql}:{password_mysql}@{host_mysql}:{port_mysql}/{database_mysql}"
   "mysql+pymysql://papatas:Patatas2024%40@192.168.1.133:3306/web"
)

# -----------------------------------
# CARGAR DATOS EN MYSQL
# -----------------------------------
# Si deseas vaciar antes la tabla:
from sqlalchemy import text

with engine_mysql.connect() as conn:
    conn.execute(text("TRUNCATE TABLE stock_aristo;"))
    conn.commit()

df.to_sql('stock_aristo', con=engine_mysql, if_exists='append', index=False)

print("Datos insertados correctamente en MySQL -> tabla stock_interco")





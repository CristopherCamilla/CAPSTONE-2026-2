CREATE TABLE facturas (
  id VARCHAR(20) NOT NULL,                        -- código único de la guía (ej: 1GDV0000001234)
  empresa VARCHAR(20) NOT NULL,                   -- 'ARISTO' o 'INTERCO'
  fecha_ingreso DATE DEFAULT CURRENT_TIMESTAMP,
  tipo_documento VARCHAR(10) NOT NULL,            -- GDV
  numero_documento VARCHAR(20) NOT NULL,
  rut VARCHAR(20) NOT NULL,
  cliente VARCHAR(100) NOT NULL,
  pares INT DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente',
  obserbacion VARCHAR(500)  NULL,
  UNIQUE KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
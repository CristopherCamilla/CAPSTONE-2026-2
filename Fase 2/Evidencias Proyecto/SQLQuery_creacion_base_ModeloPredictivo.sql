CREATE DATABASE ModeloPredictivo;
GO

USE ModeloPredictivo;
GO




CREATE TABLE ventas (
	Id				INT,
    Documento       VARCHAR(20),     -- NUDO
    TipoDocumento   VARCHAR(10),     -- TIDO
    RUT             VARCHAR(20),     -- ENDO
    Cliente         VARCHAR(200),    -- NOKOEN
    Vendedor        VARCHAR(50),     -- KOFUEN
    Region          VARCHAR(50),     -- CIEN
    Fecha           DATE,            -- FEEMDO
    CodigoFull      VARCHAR(50),     -- KOPRCT
    Codigo          VARCHAR(10),     -- LEFT(KOPRCT,4)
    Color           VARCHAR(10),     -- MID(KOPRCT,5,2)
    Talla           VARCHAR(10),     -- MID(KOPRCT,7,2)
    Genero          VARCHAR(50),     -- FMPR
    Categoria       VARCHAR(50),     -- PFPR
    SubCategoria    VARCHAR(50),     -- HFPR
	PrecioUnitario	INT,			 -- PPPRNE
    Cantidad        INT,             -- CAPRCO1
    Nulas           INT,             -- CAPRAD1
    Entregadas      INT              -- CAPREX1
);
GO



CREATE TABLE pedidos (
	Id				INT,
    Documento       VARCHAR(20),     -- NUDO
    TipoDocumento   VARCHAR(10),     -- TIDO
    RUT             VARCHAR(20),     -- ENDO
    Cliente         VARCHAR(200),    -- NOKOEN
    Vendedor        VARCHAR(50),     -- KOFUEN
    Region          VARCHAR(50),     -- CIEN
    Fecha           DATE,            -- FEEMDO
    CodigoFull      VARCHAR(50),     -- KOPRCT
    Codigo          VARCHAR(10),     -- LEFT(KOPRCT,4)
    Color           VARCHAR(10),     -- MID(KOPRCT,5,2)
    Talla           VARCHAR(10),     -- MID(KOPRCT,7,2)
    Genero          VARCHAR(50),     -- FMPR
    Categoria       VARCHAR(50),     -- PFPR
    SubCategoria    VARCHAR(50),     -- HFPR
	PrecioUnitario	INT,			 -- PPPRNE
    Cantidad        INT,             -- CAPRCO1
    Nulas           INT,             -- CAPRAD1
    Entregadas      INT              -- CAPREX1
);
GO

USE ModeloPredictivo;
GO

DROP TABLE ventas;
DROP TABLE pedidos
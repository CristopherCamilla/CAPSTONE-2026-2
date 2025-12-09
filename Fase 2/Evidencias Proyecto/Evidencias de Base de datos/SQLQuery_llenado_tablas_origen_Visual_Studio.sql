SELECT
    d.NUDO AS Documento,
    d.TIDO AS TipoDocumento,
    d.ENDO AS RUT,
    e.NOKOEN AS Cliente,
    e.KOFUEN AS Vendedor,
    e.CIEN AS Region,
    ed.FEEMDO AS Fecha,
    d.KOPRCT AS CodigoFull,
    LEFT(d.KOPRCT, 4) AS Codigo,
    SUBSTRING(d.KOPRCT, 5, 2) AS Color,
    SUBSTRING(d.KOPRCT, 7, 2) AS Talla,
    p.FMPR AS Genero,
    p.PFPR AS Categoria,
    p.HFPR AS SubCategoria,
    d.CAPRCO1 AS Cantidad,
    d.CAPRAD1 AS Nulas,
    d.CAPREX1 AS Entregadas
FROM dbo_MAEDDO d
INNER JOIN dbo_MAEEN e ON d.ENDO = e.KOEN
INNER JOIN dbo_MAEEDO ed ON d.IDMAEEDO = ed.IDMAEEDO
INNER JOIN dbo_MAEPR p ON d.KOPRCT = p.KOPR
WHERE
    (d.TIDO = 'FCV' OR d.TIDO = 'NCV')
    AND ed.FEEMDO > '2021-01-01'
    AND d.TIPR = 'FPN';

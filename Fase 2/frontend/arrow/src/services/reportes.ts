export type ReportRow = {
    imagen: string | null;
    codigo: string;
    nombre_color: string | null;
    genero: string | null;
    categoria: string | null;
    sub_categoria: string | null;
    stock_actual: number;
    articulos_en_linea: number;
    venta_prom_6m_estimada: number;
    venta_prom_x_articulo_estimada: number;
};

export async function listarReportes(limit = 100, offset = 0): Promise<ReportRow[]> {
    const res = await fetch(`/api/reportes?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('No se pudo obtener reportes');
    return await res.json();
}
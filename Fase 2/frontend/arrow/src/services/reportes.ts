import { http } from '@/lib/http';

export type ReportRow = {
    imagen?: string
    codigo: string
    nombre_color: string
    genero: string
    categoria: string
    sub_categoria: string
    articulos_en_linea: number
    stock_actual: number
    venta_prom_6m_estimada: number
    venta_prom_x_articulo_estimada: number
}

export type ReportFilters = {
    codigo?: string
    genero?: string | null
    categoria?: string | null
    subcategoria?: string | null
}

export async function listarReportes(
    limit = 100,
    offset = 0,
    filters: ReportFilters = {}
): Promise<ReportRow[]> {
    const params: any = { limit, offset }

    if (filters.codigo) params.codigo = filters.codigo
    if (filters.genero) params.genero = filters.genero
    if (filters.categoria) params.categoria = filters.categoria
    if (filters.subcategoria) params.subcategoria = filters.subcategoria

    const { data } = await http.get('/api/reportes', { params })
    return data as ReportRow[]

}

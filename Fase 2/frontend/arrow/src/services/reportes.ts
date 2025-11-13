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
    const params: any = { limit, offset };

    if (filters.codigo) params.codigo = filters.codigo;  // Permite cadenas vacías
    if (filters.genero) params.genero = filters.genero;
    if (filters.categoria) params.categoria = filters.categoria;
    if (filters.subcategoria) params.subcategoria = filters.subcategoria;

    console.log('Filtros para mandar parametros : ', params);

    console.log('filtros para mandar filtros :', filters.genero);

    const { data } = await http.get('/api/reportes', { params })
    console.log('en data ', params)
    return data as ReportRow[]

}

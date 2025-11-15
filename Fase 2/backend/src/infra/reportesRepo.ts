// reportesRepo.ts
import { pool } from "./db.js";
import type { RowDataPacket } from "mysql2";

export interface ReportRow extends RowDataPacket {
    row_id: number;
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
}

export interface ReportFilters {
    codigo?: string;
    genero?: string | null;
    categoria?: string | null;
    subcategoria?: string | null;
}

interface CountRow extends RowDataPacket {
    total: number;
}

export interface ReportListResult {
    items: ReportRow[];
    total: number;
}

// para el tipo de los filtros
interface FilaTexto extends RowDataPacket {
    nombre: string;
}

export const reportesRepo = {
    async list(
        limit = 100,
        offset = 0,
        filters: ReportFilters = {}
    ): Promise<ReportListResult> {
        const whereClauses: string[] = [
            "(COALESCE(si.stock,0) + COALESCE(sa.stock,0)) > 0",
        ];
        const params: any[] = [];

        if (filters.codigo) {
            whereClauses.push("a.codigo LIKE ?");
            params.push(`%${filters.codigo}%`);
        }
        if (filters.genero) {
            whereClauses.push("g.genero = ?");
            params.push(filters.genero);
        }
        if (filters.categoria) {
            whereClauses.push("ca.categoria = ?");
            params.push(filters.categoria);
        }
        if (filters.subcategoria) {
            whereClauses.push("sca.subcategoria = ?");
            params.push(filters.subcategoria);
        }

        const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

        const fromAndJoins = `
      FROM articulos a
      LEFT JOIN color           c   ON a.color         = c.color
      LEFT JOIN stock_interco   si  ON a.codigo_color  = si.codigo_color
      LEFT JOIN stock_aristo    sa  ON a.codigo_color  = sa.codigo_color
      LEFT JOIN proyeccion_ventas_total p ON a.id_linea = p.id_linea
      LEFT JOIN genero          g   ON a.genero        = g.cod_genero
      LEFT JOIN categoria       ca  ON a.categoria     = ca.cod_categoria
      LEFT JOIN sub_categoria   sca ON a.sub_categoria = sca.cod_subcategoria
    `;

        // === datos con LIMIT/OFFSET ===
        const dataSql = `
      SELECT
         ROW_NUMBER() OVER (ORDER BY a.codigo, g.genero, ca.categoria, sca.subcategoria) AS row_id,
        a.imagen,
        a.codigo,
        c.nombre_color AS nombre_color,
        g.genero       AS genero,
        ca.categoria   AS categoria,
        sca.subcategoria AS sub_categoria,
        (COALESCE(si.stock,0) + COALESCE(sa.stock,0)) AS stock_actual,
        COALESCE(p.articulos_en_linea, 0)              AS articulos_en_linea,
        COALESCE(p.venta_prom_6m_estimada, 0.00)       AS venta_prom_6m_estimada,
        COALESCE(p.venta_prom_x_articulo_estimada, 0.00) AS venta_prom_x_articulo_estimada
      ${fromAndJoins}
      ${whereSql}
      ORDER BY a.codigo
      LIMIT ? OFFSET ?
    `;

        const dataParams = [...params, limit, offset];

        const [items] = await pool.query<ReportRow[]>(dataSql, dataParams);

        // === total sin LIMIT/OFFSET ===
        const countSql = `
      SELECT COUNT(*) AS total
      ${fromAndJoins}
      ${whereSql}
    `;
        const [countRows] = await pool.query<CountRow[]>(countSql, params);
        const total = countRows[0]?.total ?? 0;

        return { items, total };
    },

    async getFiltros() {
        const [generos] = await pool.query<FilaTexto[]>(
            "SELECT DISTINCT genero AS nombre FROM genero ORDER BY genero"
        );
        const [categorias] = await pool.query<FilaTexto[]>(
            "SELECT DISTINCT categoria AS nombre FROM categoria ORDER BY categoria"
        );
        const [subcategorias] = await pool.query<FilaTexto[]>(
            "SELECT DISTINCT subcategoria AS nombre FROM sub_categoria ORDER BY subcategoria"
        );

        return {
            generos: generos.map(g => g.nombre),
            categorias: categorias.map(c => c.nombre),
            subcategorias: subcategorias.map(s => s.nombre),
        };
    },
};
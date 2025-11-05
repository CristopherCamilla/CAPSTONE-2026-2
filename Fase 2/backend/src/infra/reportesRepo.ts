import { pool } from "./db.js";
import type { RowDataPacket } from "mysql2";

export interface ReportRow extends RowDataPacket {
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
    // si te sirve para el front, añade también:
    // id_linea?: string | null;
}

export const reportesRepo = {
    async list(limit = 100, offset = 0): Promise<ReportRow[]> {
        const [rows] = await pool.query<ReportRow[]>(
            `
      SELECT
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
      FROM articulos a
      LEFT JOIN color             c   ON a.color = c.color
      LEFT JOIN stock_interco     si  ON a.codigo_color = si.codigo_color
      LEFT JOIN stock_aristo      sa  ON a.codigo_color = sa.codigo_color
      LEFT JOIN proyeccion_ventas_total p ON a.id_linea = p.id_linea
      LEFT JOIN genero            g   ON a.genero = g.cod_genero
      LEFT JOIN categoria         ca  ON a.categoria = ca.cod_categoria
      LEFT JOIN sub_categoria     sca ON a.sub_categoria = sca.cod_subcategoria
      WHERE (COALESCE(si.stock,0) + COALESCE(sa.stock,0)) > 0
      ORDER BY a.codigo
      LIMIT ? OFFSET ?
      `,
            [limit, offset]
        );
        return rows;
    },
};

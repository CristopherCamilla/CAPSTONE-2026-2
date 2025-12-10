import { pool } from "./db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export interface ArticuloRow extends RowDataPacket {
    id: number;
    empresa: string;
    codigo: string;
    color: string;         // ej: "AZUL"
    codigo_color: string;  // ej: "A123"
    TEMPO: string;
    GENERO: string;        // p.ej. código/descripcion
    CATEGORIA: string;
    SUB_CATEGORIA: string;
    imagen: string | null;
    fecha_creacion: string; // timestamp
}

export const articulosRepo = {
    async list(filters: {
        page?: number; pageSize?: number;
        empresa?: string; codigo?: string; color?: string;
        categoria?: string; genero?: string; codigo_color?: string;
    } = {}) {
        const page = Number(filters.page ?? 1);
        const pageSize = Math.min(Number(filters.pageSize ?? 20), 100);
        const offset = (page - 1) * pageSize;

        const where: string[] = [];
        const vals: any[] = [];
        if (filters.empresa) { where.push("empresa = ?"); vals.push(filters.empresa); }
        if (filters.codigo)  { where.push("codigo LIKE ?"); vals.push(`%${filters.codigo}%`); }
        if (filters.color)   { where.push("color = ?"); vals.push(filters.color); }
        if (filters.codigo_color) { where.push("codigo_color = ?"); vals.push(filters.codigo_color); }
        if (filters.categoria) { where.push("CATEGORIA = ?"); vals.push(filters.categoria); }
        if (filters.genero)  { where.push("GENERO = ?"); vals.push(filters.genero); }
        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const [items] = await pool.query<ArticuloRow[]>(
            `SELECT id, empresa, codigo, color, codigo_color, TEMPO, GENERO, CATEGORIA, SUB_CATEGORIA, imagen, fecha_creacion
       FROM articulos
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
            [...vals, pageSize, offset]
        );

        const [[{ total }]] = await pool.query<any[]>(`SELECT COUNT(*) AS total FROM articulos ${whereSql}`, vals);
        return { items, page, pageSize, total };
    },

    async getById(id: number) {
        const [rows] = await pool.query<ArticuloRow[]>(
            `SELECT id, empresa, codigo, color, codigo_color, TEMPO, GENERO, CATEGORIA, SUB_CATEGORIA, imagen, fecha_creacion
       FROM articulos WHERE id = ?`, [id]
        );
        return rows[0] ?? null;
    },

    async create(data: Omit<ArticuloRow, "id" | "fecha_creacion">) {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO articulos (empresa, codigo, color, codigo_color, TEMPO, GENERO, CATEGORIA, SUB_CATEGORIA, imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [data.empresa, data.codigo, data.color, data.codigo_color, data.TEMPO, data.GENERO, data.CATEGORIA, data.SUB_CATEGORIA, data.imagen ?? null]
        );
        return this.getById(res.insertId);
    },

    async update(id: number, data: Partial<Omit<ArticuloRow,"id"|"fecha_creacion">>) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(data)) {
            if (v === undefined) continue;
            sets.push(`${k} = ?`);
            vals.push(v);
        }
        if (!sets.length) return this.getById(id);
        vals.push(id);
        await pool.execute(`UPDATE articulos SET ${sets.join(", ")} WHERE id = ?`, vals);
        return this.getById(id);
    },

    async remove(id: number) {
        await pool.execute("DELETE FROM articulos WHERE id = ?", [id]);
        return { ok: true };
    }
};
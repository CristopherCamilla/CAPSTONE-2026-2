import { pool } from "./db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export interface CategoriaRow extends RowDataPacket {
    id: number;
    cod_categoria: string;
    categoria: string;
    factor: number | null;
}

export const categoriasRepo = {
    list: async () => {
        const [rows] = await pool.query<CategoriaRow[]>("SELECT id, cod_categoria, categoria, factor FROM categoria ORDER BY id DESC");
        return rows;
    },
    getById: async (id: number) => {
        const [rows] = await pool.query<CategoriaRow[]>("SELECT id, cod_categoria, categoria, factor FROM categoria WHERE id = ?", [id]);
        return rows[0] ?? null;
    },
    create: async (data: Omit<CategoriaRow,"id">) => {
        const [res] = await pool.execute<ResultSetHeader>(
            "INSERT INTO categoria (cod_categoria, categoria, factor) VALUES (?, ?, ?)",
            [data.cod_categoria, data.categoria, data.factor ?? null]
        );
        return categoriasRepo.getById(res.insertId);
    },
    update: async (id: number, data: Partial<Omit<CategoriaRow,"id">>) => {
        const sets: string[] = []; const vals: any[] = [];
        for (const [k, v] of Object.entries(data)) { if (v === undefined) continue; sets.push(`${k} = ?`); vals.push(v); }
        if (!sets.length) return categoriasRepo.getById(id);
        vals.push(id);
        await pool.execute(`UPDATE categoria SET ${sets.join(", ")} WHERE id = ?`, vals);
        return categoriasRepo.getById(id);
    },
    remove: async (id: number) => {
        await pool.execute("DELETE FROM categoria WHERE id = ?", [id]);
        return { ok: true };
    }
};

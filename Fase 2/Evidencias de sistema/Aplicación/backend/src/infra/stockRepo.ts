import { pool } from "./db.js";
import type { RowDataPacket } from "mysql2";

export interface StockRow extends RowDataPacket {
    id: number;
    codigo_color: string;
    stock: number;
}

export const stockRepo = {
    listAristo: async (codigo_color?: string) => {
        const where = codigo_color ? "WHERE codigo_color = ?" : "";
        const params = codigo_color ? [codigo_color] : [];
        const [rows] = await pool.query<StockRow[]>(
            `SELECT id, codigo_color, stock FROM stock_aristo ${where} ORDER BY id DESC`, params
        );
        return rows;
    },
    updateAristo: async (id: number, stock: number) => {
        await pool.execute("UPDATE stock_aristo SET stock = ? WHERE id = ?", [stock, id]);
        return { ok: true };
    },
    listInterco: async (codigo_color?: string) => {
        const where = codigo_color ? "WHERE codigo_color = ?" : "";
        const params = codigo_color ? [codigo_color] : [];
        const [rows] = await pool.query<StockRow[]>(
            `SELECT id, codigo_color, stock FROM stock_interco ${where} ORDER BY id DESC`, params
        );
        return rows;
    },
    updateInterco: async (id: number, stock: number) => {
        await pool.execute("UPDATE stock_interco SET stock = ? WHERE id = ?", [stock, id]);
        return { ok: true };
    }
};
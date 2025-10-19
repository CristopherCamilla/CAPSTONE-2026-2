import { pool } from "./db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export interface UsuarioRow extends RowDataPacket {
    id: number;
    nombre: string;
    apellido: string;
    usuario: string;
    email: string;
    password: string;
    rol: "admin" | "editor" | "usuario";
    estado: "activo" | "inactivo";
    fecha_registro: string;   // timestamp
    ultima_conexion: string | null; // datetime
}

export const usuariosRepo = {
    async list(opts: { page?: number; pageSize?: number; search?: string } = {}) {
        const page = Number(opts.page ?? 1);
        const pageSize = Math.min(Number(opts.pageSize ?? 20), 100);
        const offset = (page - 1) * pageSize;

        const where: string[] = [];
        const params: any[] = [];
        if (opts.search) {
            where.push("(nombre LIKE ? OR apellido LIKE ? OR usuario LIKE ? OR email LIKE ?)");
            const like = `%${opts.search}%`;
            params.push(like, like, like, like);
        }
        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const [items] = await pool.query<UsuarioRow[]>(
            `
      SELECT id, nombre, apellido, usuario, email, rol, estado, fecha_registro, ultima_conexion
      FROM usuarios
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
            [...params, pageSize, offset]
        );

        const [[{ total }]] = await pool.query<any[]>(
            `SELECT COUNT(*) AS total FROM usuarios ${whereSql}`, params
        );

        return { items, page, pageSize, total };
    },

    async getById(id: number) {
        const [rows] = await pool.query<UsuarioRow[]>(
            `SELECT id, nombre, apellido, usuario, email, password, rol, estado, fecha_registro, ultima_conexion
       FROM usuarios WHERE id = ?`,
            [id]
        );
        return rows[0] ?? null;
    },

    async create(data: {
        nombre: string; apellido: string; usuario: string; email: string;
        password: string; rol: string; estado: string;
    }) {
        const [res] = await pool.execute<ResultSetHeader>(
            `INSERT INTO usuarios (nombre, apellido, usuario, email, password, rol, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.nombre, data.apellido, data.usuario, data.email, data.password, data.rol, data.estado]
        );
        return this.getById(res.insertId);
    },

    async update(id: number, data: Partial<Omit<UsuarioRow,"id">>) {
        const sets: string[] = [];
        const vals: any[] = [];
        for (const [k, v] of Object.entries(data)) {
            if (v === undefined) continue;
            sets.push(`${k} = ?`);
            vals.push(v);
        }
        if (!sets.length) return this.getById(id);
        vals.push(id);
        await pool.execute(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`, vals);
        return this.getById(id);
    },

    async remove(id: number) {
        await pool.execute("DELETE FROM usuarios WHERE id = ?", [id]);
        return { ok: true };
    }
};
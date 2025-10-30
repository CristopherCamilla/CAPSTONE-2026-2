import { pool } from './db.js';
import type { RowDataPacket, ResultSetHeader  } from "mysql2";

export interface ProyeccionVentasRow extends RowDataPacket {
    id: number;
    id_linea: string;
    color: string;
    genero: string;
    categoria: string;
    sub_categoria: string;
    articulos_en_linea: string;
    ventas_prom_6m_estimado: number;
    ventas_prom_x_articulo_stimado: number;
    fecha_proyeccion: string;
}

export const proyeccionVentasRepo = {

    // SELECT *
    async list(): Promise<ProyeccionVentasRow[]> {
        const [rows] = await pool.query<ProyeccionVentasRow[]>(
            "SELECT * FROM proyeccion_ventas_total"
        );
        return rows;
    },

    // INSERT ... SET ?
    async create(data: any): Promise<ProyeccionVentasRow> {
        const [res] = await pool.execute<ResultSetHeader>(
            "INSERT INTO proyeccion_ventas_total SET ?",
            [data]
        );
        // res.insertId es el ID generado
        return { id: res.insertId, ...data } as ProyeccionVentasRow;
    },

    // UPDATE ... WHERE id = ?
    async update(id: number, data: any): Promise<ProyeccionVentasRow | null> {
        const [res] = await pool.execute<ResultSetHeader>(
            "UPDATE proyeccion_ventas_total SET ? WHERE id = ?",
            [data, id]
        );
        if (res.affectedRows === 0) return null;
        return { id, ...data } as ProyeccionVentasRow;
    },

    // SELECT ... WHERE id = ?
    async getById(id: number): Promise<ProyeccionVentasRow | null> {
        const [rows] = await pool.query<ProyeccionVentasRow[]>(
            "SELECT * FROM proyeccion_ventas_total WHERE id = ?",
            [id]
        );
        return rows[0] ?? null;
    },

    // DELETE ... WHERE id = ?
    async remove(id: number): Promise<boolean> {
        const [res] = await pool.execute<ResultSetHeader>(
            "DELETE FROM proyeccion_ventas_total WHERE id = ?",
            [id]
        );
        return res.affectedRows > 0;
    },
}
import { pool } from './db.js';
import type { RowDataPacket } from "mysql2";

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

    // Obtener todos los registros
    list: async (): Promise<ProyeccionVentasRow[]> => {
        const [rows] = await pool.query('SELECT * FROM proyeccion_ventas_total');
        return rows as ProyeccionVentasRow[];
    },

    // Crear un nuevo registro
    create: async (data: any): Promise<ProyeccionVentasRow> => {
        const [result] = await pool.query(
            'INSERT INTO proyeccion_ventas_total SET ?',
            [data]
        );
        return result as ProyeccionVentasRow;
    },

    // Actualizar un registro existente
    update: async (id: number, data: any): Promise<ProyeccionVentasRow | null> => {
        const [result] = await pool.query(
            'UPDATE proyeccion_ventas_total SET ? WHERE id = ?',
            [data, id]
        );
        if (result.affectedRows === 0) return null; // Si no se actualiza nada, devolver null
        return { id, ...data } as ProyeccionVentasRow; // Devuelve el registro actualizado
    },

    // Obtener un registro por ID
    getById: async (id: number): Promise<ProyeccionVentasRow | null> => {
        const [rows] = await pool.query('SELECT * FROM proyeccion_ventas_total WHERE id = ?', [id]);
        return rows[0] ? (rows[0] as ProyeccionVentasRow) : null;
    },

    // Eliminar un registro por ID
    remove: async (id: number): Promise<boolean> => {
        const [result] = await pool.query('DELETE FROM proyeccion_ventas_total WHERE id = ?', [id]);
        return result.affectedRows > 0; // Devuelve true si el registro fue eliminado
    }
};
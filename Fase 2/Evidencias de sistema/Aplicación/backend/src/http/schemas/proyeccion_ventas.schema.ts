import { z } from 'zod';

export const ProyeccionVentasTotalSchema = z.object({
    id: z.number().int(),
    linea: z.string().max(100),
    color: z.string().max(10),
    genero: z.string().max(20),
    categoria: z.string().max(30),
    subcategoria: z.string().max(30),
    articulos_en_linea: z.number().int(),
    venta_prom_6m_estimado: z.number().optional(),
    venta_prom_x_articulo_estimado: z.number().optional(),
    fecha_proyeccion: z.date(),
});
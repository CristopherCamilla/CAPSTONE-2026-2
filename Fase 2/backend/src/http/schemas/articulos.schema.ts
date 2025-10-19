import { z } from "zod";

export const ArticuloCreateSchema = z.object({
    empresa: z.string().min(1),
    codigo: z.string().min(1),
    color: z.string().min(1),
    codigo_color: z.string().min(1),
    TEMPO: z.string().min(1),
    GENERO: z.string().min(1),
    CATEGORIA: z.string().min(1),
    SUB_CATEGORIA: z.string().min(1),
    imagen: z.string().url().optional().or(z.literal("").transform(()=>undefined))
});

export const ArticuloUpdateSchema = ArticuloCreateSchema.partial();

export type ArticuloCreate = z.infer<typeof ArticuloCreateSchema>;
export type ArticuloUpdate = z.infer<typeof ArticuloUpdateSchema>;
import { z } from "zod";

export const UsuarioCreateSchema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    usuario: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    rol: z.enum(["admin", "editor", "usuario"]).default("usuario"),
    estado: z.enum(["activo", "inactivo"]).default("activo")
});

export const UsuarioUpdateSchema = UsuarioCreateSchema.partial()
    .extend({ password: z.string().min(6).optional() });

export type UsuarioCreate = z.infer<typeof UsuarioCreateSchema>;

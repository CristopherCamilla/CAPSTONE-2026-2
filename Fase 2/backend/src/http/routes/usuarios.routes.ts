import type { FastifyInstance } from "fastify";
import { usuariosRepo } from "../../infra/usuariosRepo.js";
import { UsuarioCreateSchema, UsuarioUpdateSchema } from "../schemas/usuarios.schema.js";
import bcrypt from "bcryptjs";

export async function usuariosRoutes(app: FastifyInstance) {
    app.get("/api/usuarios", async (req) => {
        const url = new URL((req as any).raw.url!, "http://x");
        const page = Number(url.searchParams.get("page") ?? 1);
        const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
        const search = url.searchParams.get("search") ?? undefined;
        return usuariosRepo.list({ page, pageSize, search });
    });

    app.get("/api/usuarios/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const u = await usuariosRepo.getById(id);
        if (!u) return reply.code(404).send({ message: "No encontrado" });
        // nunca devolver password
        const { password, ...safe } = u as any;
        return safe;
    });

    app.post("/api/usuarios", async (req, reply) => {
        const parsed = UsuarioCreateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
        const hashed = await bcrypt.hash(parsed.data.password, 10);
        const created = await usuariosRepo.create({ ...parsed.data, password: hashed });
        const { password, ...safe } = created as any;
        return reply.code(201).send(safe);
    });

    app.put("/api/usuarios/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const parsed = UsuarioUpdateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
        const payload = { ...parsed.data } as any;
        if (payload.password) payload.password = await bcrypt.hash(payload.password, 10);
        const updated = await usuariosRepo.update(id, payload);
        if (!updated) return reply.code(404).send({ message: "No encontrado" });
        const { password, ...safe } = updated as any;
        return safe;
    });

    app.delete("/api/usuarios/:id", async (req) => {
        const id = Number((req.params as any).id);
        return usuariosRepo.remove(id);
    });
}
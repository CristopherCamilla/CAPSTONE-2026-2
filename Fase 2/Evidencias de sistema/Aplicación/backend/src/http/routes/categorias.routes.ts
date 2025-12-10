import type { FastifyInstance } from "fastify";
import { categoriasRepo } from "../../infra/categoriasRepo.js";
import { z } from "zod";

const Create = z.object({
    cod_categoria: z.string().min(1),
    categoria: z.string().min(1),
    factor: z.number().optional()
});
const Update = Create.partial();

export async function categoriasRoutes(app: FastifyInstance) {
    app.get("/api/categorias", async () => categoriasRepo.list());
    app.get("/api/categorias/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const row = await categoriasRepo.getById(id);
        if (!row) return reply.code(404).send({ message: "No encontrado" });
        return row;
    });
    app.post("/api/categorias", async (req, reply) => {
        const p = Create.safeParse(req.body);
        if (!p.success) return reply.code(400).send(p.error.flatten());
        const created = await categoriasRepo.create(p.data as any);
        return reply.code(201).send(created);
    });
    app.put("/api/categorias/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const p = Update.safeParse(req.body);
        if (!p.success) return reply.code(400).send(p.error.flatten());
        const updated = await categoriasRepo.update(id, p.data as any);
        if (!updated) return reply.code(404).send({ message: "No encontrado" });
        return updated;
    });
    app.delete("/api/categorias/:id", async (req) => {
        const id = Number((req.params as any).id);
        return categoriasRepo.remove(id);
    });
}
import type { FastifyInstance } from "fastify";
import { articulosRepo } from "../../infra/articulosRepo.js";
import { ArticuloCreateSchema, ArticuloUpdateSchema } from "../schemas/articulos.schema.js";

export async function articulosRoutes(app: FastifyInstance) {
    app.get("/api/articulos", async (req) => {
        const url = new URL((req as any).raw.url!, "http://x");
        return articulosRepo.list({
            page: Number(url.searchParams.get("page") ?? 1),
            pageSize: Number(url.searchParams.get("pageSize") ?? 20),
            empresa: url.searchParams.get("empresa") ?? undefined,
            codigo: url.searchParams.get("codigo") ?? undefined,
            color: url.searchParams.get("color") ?? undefined,
            codigo_color: url.searchParams.get("codigo_color") ?? undefined,
            categoria: url.searchParams.get("categoria") ?? undefined,
            genero: url.searchParams.get("genero") ?? undefined
        });
    });

    app.get("/api/articulos/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const a = await articulosRepo.getById(id);
        if (!a) return reply.code(404).send({ message: "No encontrado" });
        return a;
    });

    app.post("/api/articulos", async (req, reply) => {
        const parsed = ArticuloCreateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
        const created = await articulosRepo.create(parsed.data as any);
        return reply.code(201).send(created);
    });

    app.put("/api/articulos/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const parsed = ArticuloUpdateSchema.safeParse(req.body);
        if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
        const updated = await articulosRepo.update(id, parsed.data as any);
        if (!updated) return reply.code(404).send({ message: "No encontrado" });
        return updated;
    });

    app.delete("/api/articulos/:id", async (req) => {
        const id = Number((req.params as any).id);
        return articulosRepo.remove(id);
    });
}
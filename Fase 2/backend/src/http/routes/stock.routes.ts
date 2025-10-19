import type { FastifyInstance } from "fastify";
import { stockRepo } from "../../infra/stockRepo.js";
import { z } from "zod";

export async function stockRoutes(app: FastifyInstance) {
    app.get("/api/stock/aristo", async (req) => {
        const url = new URL((req as any).raw.url!, "http://x");
        const codigo_color = url.searchParams.get("codigo_color") ?? undefined;
        return stockRepo.listAristo(codigo_color);
    });
    app.put("/api/stock/aristo/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const p = z.object({ stock: z.number().int().min(0) }).safeParse(req.body);
        if (!p.success) return reply.code(400).send(p.error.flatten());
        return stockRepo.updateAristo(id, p.data.stock);
    });

    app.get("/api/stock/interco", async (req) => {
        const url = new URL((req as any).raw.url!, "http://x");
        const codigo_color = url.searchParams.get("codigo_color") ?? undefined;
        return stockRepo.listInterco(codigo_color);
    });
    app.put("/api/stock/interco/:id", async (req, reply) => {
        const id = Number((req.params as any).id);
        const p = z.object({ stock: z.number().int().min(0) }).safeParse(req.body);
        if (!p.success) return reply.code(400).send(p.error.flatten());
        return stockRepo.updateInterco(id, p.data.stock);
    });
}
import type { FastifyInstance } from "fastify";
import { reportesRepo } from "../../infra/reportesRepo.js";

export async function reportesRoutes(app: FastifyInstance) {
    app.get("/api/reportes", async (req, reply) => {
        // querystring simples: ?limit=200&offset=0
        const q = req.query as { limit?: string; offset?: string };
        const limit = Number(q.limit ?? 100);
        const offset = Number(q.offset ?? 0);

        const data = await reportesRepo.list(limit, offset);
        return reply.send(data);
    });
}
// reportes.routes.ts
import type { FastifyInstance } from "fastify";
import { reportesRepo, type ReportFilters } from "../../infra/reportesRepo.js";

export async function reportesRoutes(app: FastifyInstance) {
    app.get("/api/reportes", async (req, reply) => {
        const q = req.query as {
            limit?: string;
            offset?: string;
            codigo?: string;
            genero?: string;
            categoria?: string;
            subcategoria?: string;
        };

        const limit  = Number(q.limit  ?? 100);
        const offset = Number(q.offset ?? 0);

        const filters: ReportFilters = {};

        if (q.codigo && q.codigo.trim() !== "") filters.codigo = q.codigo;
        if (q.genero && q.genero.trim() !== "") filters.genero = q.genero;
        if (q.categoria && q.categoria.trim() !== "") filters.categoria = q.categoria;
        if (q.subcategoria && q.subcategoria.trim() !== "") filters.subcategoria = q.subcategoria;

        app.log.info({ q, filters }, "Filtros en /api/reportes");

        const data = await reportesRepo.list(limit, offset, filters);
        return reply.send(data);   // { items, total }
    });


    // === NUEVO: filtros para los combos ===
    app.get("/api/reportes/filtros", async (_req, reply) => {
        try {
            const filtros = await reportesRepo.getFiltros(); // la función nueva en reportesRepo
            return reply.send(filtros);
        } catch (err) {
            app.log.error({ err }, "Error obteniendo filtros de reportes");
            return reply.status(500).send({ message: "Error obteniendo filtros" });
        }
    });
}

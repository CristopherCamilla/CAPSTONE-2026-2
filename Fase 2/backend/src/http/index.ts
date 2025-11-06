// src/http/index.ts
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import "dotenv/config";

// (opcional en DEV si sirves estáticos desde el backend)
// import fastifyStatic from "@fastify/static";
// import { fileURLToPath } from "url";
// import { dirname, resolve } from "path";

import { usuariosRoutes } from "./routes/usuarios.routes.js";
import { articulosRoutes } from "./routes/articulos.routes.js";
import { categoriasRoutes } from "./routes/categorias.routes.js";
import { stockRoutes } from "./routes/stock.routes.js";
import { proyeccionVentasRoutes } from "./routes/proyeccionVentas.routes.js";
import { reportesRoutes } from "./routes/reportes.routes.js";

const isProd = process.env.NODE_ENV === "production";
const PORT   = Number(process.env.PORT ?? 3001);

async function main() {
    const app = Fastify({ logger: true });

    // ⬇️ AQUÍ VA CORS (después de crear app, antes de rutas)
    await app.register(fastifyCors, {
        // En PRODUCCIÓN: mismo dominio detrás de Apache → CORS realmente no se necesita.
        // Si igual quieres restringir, pon tu dominio real:
        origin: isProd ? ["https://midominio.com"] : ["http://localhost:5173"],
        credentials: true,
    });

    // (opcional) Servir estáticos SOLO en desarrollo
    // if (!isProd) {
    //   const __filename = fileURLToPath(import.meta.url);
    //   const __dirname  = dirname(__filename);
    //   await app.register(fastifyStatic, {
    //     root: resolve(__dirname, "../../public"),
    //     prefix: "/",
    //     index: ["index.html"],
    //   });
    // }

    // Health (útil con ProxyPass /api)
    app.get("/api/health", async () => ({ ok: true, ts: Date.now() }));

    // Tus rutas API
    await app.register(usuariosRoutes);
    await app.register(articulosRoutes);
    await app.register(categoriasRoutes);
    await app.register(stockRoutes);
    await app.register(proyeccionVentasRoutes);
    await app.register(reportesRoutes);

    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`API http://localhost:${PORT} NODE_ENV=${process.env.NODE_ENV}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

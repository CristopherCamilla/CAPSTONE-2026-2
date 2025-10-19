import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
//Rutas
import { usuariosRoutes } from "./routes/usuarios.routes.js";
import { articulosRoutes } from "./routes/articulos.routes.js";
import { categoriasRoutes } from "./routes/categorias.routes.js";
import { stockRoutes } from "./routes/stock.routes.js";

type R = { method: string; url: string; };
const routesRegistry: R[] = [];

function onlyGetRoutes(routes: R[]) {
    return routes
        .filter(r => r.method.includes("GET"))
        .sort((a, b) => a.url.localeCompare(b.url));
}

async function main() {
    const app = Fastify({ logger: true });

    // Captura rutas registradas
    app.addHook("onRoute", (route) => {
        const method = Array.isArray(route.method) ? route.method.join(",") : (route.method as string);
        routesRegistry.push({ method, url: route.url });
    });

    await app.register(fastifyCors, {
        origin: ["http://localhost:5173"],
        credentials: true
    });

    // Servir /public como estático (index.html en /)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    await app.register(fastifyStatic, {
        root: resolve(__dirname, "../../public"),
        prefix: "/",           // sirve en la raíz
        wildcard: false,
        index: ["index.html"]  // al abrir "/" entrega index.html
    });

    // Endpoint JSON con rutas detectadas
    app.get("/__routes", async () => ({
        health: "/health",
        endpoints: onlyGetRoutes(routesRegistry)
    }));

    app.get("/health", async () => ({ ok: true, ts: Date.now() }));

    await app.register(usuariosRoutes);
    await app.register(articulosRoutes);
    await app.register(categoriasRoutes);
    await app.register(stockRoutes);

    const port = Number(process.env.PORT ?? 3000);
    await app.listen({ port, host: "0.0.0.0" });
    app.log.info(`API on http://localhost:${port}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyCors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { env } from '../infra/env.js'

import { authRoutes } from './routes/auth.routes.js'
import { usuariosRoutes } from './routes/usuarios.routes.js'
import { articulosRoutes } from './routes/articulos.routes.js'
import { categoriasRoutes } from './routes/categorias.routes.js'
import { stockRoutes } from './routes/stock.routes.js'
import { proyeccionVentasRoutes } from './routes/proyeccionVentas.routes.js'
import { reportesRoutes } from './routes/reportes.routes.js'

const isProd = env.NODE_ENV === 'production'
const PORT = Number(env.PORT ?? 3001)

async function main() {
    const app = Fastify({ logger: true }) as FastifyInstanceWithConfig;
    app.addHook('onRequest', async (req) => { (req as any).raw.connection.proxy = true });
    (app as any).trustProxy = true;

    app.config = { env: env.NODE_ENV }

    await app.register(fastifyCors, {
        origin: env.NODE_ENV === 'production' ? ['https://midominio.com'] : ['http://localhost:5173'],
        credentials: true,
    })

    await app.register(cookie)
    await app.register(jwt, {
        secret: env.JWT_SECRET,
        cookie: { cookieName: 'auth', signed: false },
    })

    app.decorate(
        'authenticate',
        async function (this: FastifyInstance, req: FastifyRequest, reply: FastifyReply) {
            try {
                await req.jwtVerify() // lee cookie 'auth'
            } catch {
                return reply.code(401).send({ message: 'No autorizado' })
            }
        }
    )

    app.get('/api/health', async () => ({ ok: true, ts: Date.now() }))

    await app.register(authRoutes)
    await app.register(usuariosRoutes)
    await app.register(articulosRoutes)
    await app.register(categoriasRoutes)
    await app.register(stockRoutes)
    await app.register(proyeccionVentasRoutes)
    await app.register(reportesRoutes)

    console.log(app.printRoutes())

    await app.listen({ port: PORT, host: '0.0.0.0' })
    app.log.info(`API http://localhost:${PORT} NODE_ENV=${env.NODE_ENV}`)
}

// --- Ejecuta main() SOLO una vez ---
if (process.env.__API_STARTED__ !== '1') {
    process.env.__API_STARTED__ = '1'
    main().catch((e) => {
        console.error(e)
        process.exit(1)
    })
}

// ---- Tipos
import type { FastifyInstance as FI } from 'fastify'
declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
        config: { env: 'development' | 'production' | 'test' }
    }
}
type FastifyInstanceWithConfig = FI & { config: { env: 'development' | 'production' | 'test' } }

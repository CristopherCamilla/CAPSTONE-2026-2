import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { usuariosRepo } from '../../infra/usuariosRepo.js'

const LoginBody = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
    app.post("/api/auth/login", async (req, reply) => {
        const parsed = LoginBody.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send(parsed.error.flatten());
        }

        // 🔎 Normaliza entrada (evita espacios, unicode raros)
        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;

        const user = await usuariosRepo.findByEmail(email);

        // 🔎 logs temporales de diagnóstico
        app.log.info({ email, found: !!user }, "login: user lookup");
        if (!user) return reply.code(401).send({ message: "Credenciales inválidas" });
        app.log.info({ email, plen: password.length, p0: password[0], pLast: password.at(-1) }, 'login: pwd shape')
        app.log.info({ hashPrefix: (user.password ?? '').slice(0,7), hashLen: (user.password ?? '').length }, 'login: hash shape')
        // Si usas 'estado', valida que esté activo (opcional)
        if (user.estado && user.estado !== "activo") {
            return reply.code(401).send({ message: "Usuario inactivo" });
        }

        const ok = await bcrypt.compare(password, user.password ?? '')
        app.log.info({ email, ok }, 'login: bcrypt compare')

        if (!ok) return reply.code(401).send({ message: "Credenciales inválidas" });

        const token = app.jwt.sign(
            { sub: String(user.id), email: user.email, role: user.rol ?? "usuario" },
            { expiresIn: "7d" }
        );

        const secure = app.config.env === "production";
        reply.setCookie("auth", token, {
            httpOnly: true,
            sameSite: "lax",
            secure,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return reply.send({
            user: {
                id: String(user.id),
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
            },
        });
    });

    // GET /api/auth/me  (→ 401 si no hay cookie, 200 si hay)
    app.get('/api/auth/me', { preHandler: [app.authenticate as any] }, async (req, reply) => {
        const { sub } = req.user as any
        const u = await usuariosRepo.findSafeById(Number(sub))
        if (!u) return reply.code(401).send({ message: 'No autorizad' }) // ← antes era 404
        return u
    })

    // GET /api/auth/session  → siempre 200 { user: {...} | null }
    app.get('/api/auth/session', async (req) => {
        const token = (req.cookies as Record<string, string | undefined>)?.auth;
        if (!token) return { user: null };

        try {
            const { sub } = app.jwt.verify<{ sub: string; email: string; role: string }>(token);
            const u = await usuariosRepo.findSafeById(Number(sub));
            if (!u) return { user: null };

            return {
                user: {
                    id: String(u.id),
                    email: u.email,
                    nombre: u.nombre,
                    apellido: u.apellido,
                    rol: u.rol,
                },
            };
        } catch {
            return { user: null };
        }
    });

    // POST /api/auth/logout
    app.post('/api/auth/logout', async (_req, reply) => {
        reply.clearCookie('auth', { path: '/' })
        return { ok: true }
    })
};

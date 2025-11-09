import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { usuariosRepo } from '../../infra/usuariosRepo.js'

const LoginBody = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export const authRoutes: FastifyPluginAsync = async (app) => {
    app.post("/api/auth/login", async (req, reply) => {
        const { email, password } = LoginBody.parse(req.body);

        const user = await usuariosRepo.findByEmail(email);
        if (!user) return reply.code(401).send({ message: "Credenciales inválidas" });

        // 👇 Normaliza hashes estilo PHP ($2y$) a $2a$ para que bcryptjs compare bien
        const hash = (user.password || "").replace(/^\$2y\$/, "$2a$");
        const ok = await bcrypt.compare(password, hash);
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

    app.post('/api/auth/logout', async (_req, reply) => {
        reply.clearCookie('auth', { path: '/' })
        return { ok: true }
    })
}
import '@fastify/jwt'

declare module '@fastify/jwt' {
    // payload del token
    interface FastifyJWT {
        payload: { sub: string; email: string; role: string }
        // cómo quieres ver req.user ya verificado
        user: { sub: string; email: string; role: string }
    }
}
import '@fastify/jwt';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        // lo que contiene el token firmado (verify/sign)
        payload: {
            sub: string;
            email: string;
            role: string;
        };
        // cómo quieres que tipifique req.user tras jwtVerify()
        user: {
            sub: string;
            email: string;
            role: string;
        };
    }
}
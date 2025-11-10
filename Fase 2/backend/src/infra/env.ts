import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string().min(1),
    DB_PASS: z.string().default(''),
    DB_NAME: z.string().min(1),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 chars'),
})

export const env = envSchema.parse(process.env)


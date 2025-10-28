import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    DB_HOST: z.string().min(1, "DB_HOST requerido"),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string().min(1, "DB_USER requerido"),
    DB_PASS: z.string().default(""),
    DB_NAME: z.string().min(1, "DB_NAME requerido"),
});

export const env = envSchema.parse(process.env);
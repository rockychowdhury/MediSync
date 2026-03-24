import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8000/api/v1"),
  NEXT_PUBLIC_API_TIMEOUT: z.coerce.number().default(30000),
  NEXT_PUBLIC_APP_NAME: z.string().default("MediSync"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z.coerce.boolean().default(true),
  NEXT_PUBLIC_DEMO_EMAIL: z.string().email().default("demo@medisync.com"),
  NEXT_PUBLIC_DEMO_PASSWORD: z.string().default("Demo@123"),
});

export type Env = z.infer<typeof envSchema>;

/** Validated environment variables (safe to use throughout the app) */
export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
  NEXT_PUBLIC_DEMO_EMAIL: process.env.NEXT_PUBLIC_DEMO_EMAIL,
  NEXT_PUBLIC_DEMO_PASSWORD: process.env.NEXT_PUBLIC_DEMO_PASSWORD,
});

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ALLOWED_ORIGINS: z.string().min(1),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

  REDIS_URL: z.url(),

  RESEND_API_KEY: z.string().min(1),
  FRONTEND_URL: z.url(),

  GCS_BUCKET_NAME: z.string().min(1),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());
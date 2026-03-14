import { z } from 'zod';

export const appConfig = (): Record<string, unknown> => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV,
  appName: process.env.APP_NAME,
});

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
    PORT: z.coerce.number().default(4000),
    APP_NAME: z.string(),
    DATABASE_URL: z.string().url(),
  })
  .passthrough(); // allow unknown env vars (JWT_SECRET, REDIS_*, etc.) to pass through

export type EnvConfig = z.infer<typeof envSchema>;

export const validate = (config: Record<string, unknown>): Record<string, unknown> => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Environment validation failed: ${JSON.stringify(formatted, null, 2)}`);
  }

  return result.data;
};

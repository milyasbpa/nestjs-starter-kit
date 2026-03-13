import { z } from 'zod';

export const appConfig = (): Record<string, unknown> => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV,
  appName: process.env.APP_NAME,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validate = (config: Record<string, unknown>): EnvConfig => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Environment validation failed: ${JSON.stringify(formatted, null, 2)}`);
  }

  return result.data;
};

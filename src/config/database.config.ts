import { registerAs } from '@nestjs/config';

/**
 * Database configuration namespace.
 * Prisma reads DATABASE_URL directly from env — this config exposes it
 * via ConfigService for modules that need it (e.g. health checks).
 */
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * Bootstraps a full NestJS app for E2E testing, applying the same global
 * setup as main.ts (filters, interceptors, pipes, versioning, prefix).
 *
 * Prerequisites:
 *   1. A `myapp_test` PostgreSQL database must exist.
 *   2. Run `DATABASE_URL=<test-url> npx prisma migrate deploy` once to apply migrations.
 *   3. NODE_ENV=test and `.env.test` must be configured (see .env.example).
 */
export async function createTestApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();

  // Mirror global setup from main.ts
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ZodValidationPipe());

  await app.init();
  return app;
}

/**
 * Returns the PrismaService from an initialized test app for seeding/cleanup.
 */
export function getPrisma(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

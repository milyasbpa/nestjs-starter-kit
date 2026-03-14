/**
 * Generate openapi.json from the running NestJS app definition.
 *
 * Usage:
 *   npm run generate:openapi
 *
 * Output: openapi.json at project root (gitignored).
 * Import into Postman, Insomnia, or use for client code-gen (openapi-generator, etc.)
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from '../src/app.module';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api');
  app.enableVersioning({ defaultVersion: '1' } as Parameters<typeof app.enableVersioning>[0]);

  const config = new DocumentBuilder()
    .setTitle(process.env['APP_NAME'] ?? 'NestJS API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:3000', 'Local')
    .addServer('https://api.staging.example.com', 'Staging')
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  const outPath = join(process.cwd(), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));

  await app.close();

  console.log(`✔  openapi.json written to ${outPath}`);
}

void generate();

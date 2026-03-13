import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global prefix & versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global response transform
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Zod validation
  app.useGlobalPipes(new ZodValidationPipe());

  // Swagger — non-production only
  if (process.env['NODE_ENV'] !== 'production') {
    const port = process.env['PORT'] ?? '3000';
    const config = new DocumentBuilder()
      .setTitle(process.env['APP_NAME'] ?? 'NestJS API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .addServer('https://api.staging.example.com', 'Staging')
      .build();

    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env['PORT'] ?? 3000);
}
void bootstrap();

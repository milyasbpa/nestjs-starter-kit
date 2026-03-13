import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig, validate } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { redisConfig } from './config/redis.config';
import { PrismaModule } from './database/prisma.module';

/**
 * Root Application Module
 *
 * This is the entry point for all NestJS modules.
 * As the app grows, feature modules (e.g. AuthModule, UsersModule) will be
 * imported here — either directly or through a shared CoreModule.
 *
 * Example:
 *   imports: [ConfigModule, PrismaModule, AuthModule, UsersModule, ...]
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'development'}`,
      validate,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
    }),
    PrismaModule,
    // Feature modules will be added here as the project grows
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

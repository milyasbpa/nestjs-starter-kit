import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Root Application Module
 *
 * This is the entry point for all NestJS modules.
 * As the app grows, feature modules (e.g. AuthModule, UsersModule) will be
 * imported here — either directly or through a shared CoreModule.
 *
 * Example:
 *   imports: [ConfigModule, DatabaseModule, AuthModule, UsersModule, ...]
 */
@Module({
  imports: [
    // Feature modules will be added here as the project grows
    // e.g. ConfigModule, DatabaseModule, AuthModule, UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

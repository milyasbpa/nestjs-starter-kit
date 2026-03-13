# NestJS Starter Kit — Professional & Production-Level Setup

> Checklist ini dirancang sebagai panduan lengkap untuk membangun NestJS backend project yang scalable, maintainable, dan production-ready.
> Eksekusi **satu per satu** sesuai urutan. Setiap section bisa dijadikan milestone tersendiri.

---

## Table of Contents

1. [Project Initialization](#1-project-initialization)
2. [Folder Structure & Architecture](#2-folder-structure--architecture)
3. [Code Quality & Linting](#3-code-quality--linting)
4. [Environment Configuration](#4-environment-configuration)
5. [Database & ORM](#5-database--orm)
6. [Migrations](#6-migrations)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Design & Swagger](#8-api-design--swagger)
9. [Validation & Transformation](#9-validation--transformation)
10. [Error Handling & Exception Filters](#10-error-handling--exception-filters)
11. [Logging](#11-logging)
12. [Caching](#12-caching)
13. [Queue & Background Jobs](#13-queue--background-jobs)
14. [File Upload & Storage](#14-file-upload--storage)
15. [Email & Notifications](#15-email--notifications)
16. [WebSocket / Real-time](#16-websocket--real-time)
17. [Testing Setup](#17-testing-setup)
18. [CI/CD Pipeline](#18-cicd-pipeline)
19. [Security Hardening](#19-security-hardening)
20. [Performance Optimization](#20-performance-optimization)

---

## 1. Project Initialization

- [x] Install NestJS CLI dan buat project baru:
  ```bash
  npm i -g @nestjs/cli
  nest new project-name --package-manager npm
  ```
- [x] Set `engines` di `package.json` untuk lock versi Node.js minimum:
  ```json
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
  ```
- [x] Update `package.json`: set `name`, `description`, `version` (e.g. `1.0.0`)
- [x] Inisialisasi Git repository:
  ```bash
  git init && git add . && git commit -m "chore: initial commit"
  ```
- [x] Setup `.gitignore` yang proper — tambahkan:
  ```
  .env
  .env.*
  !.env.example
  dist/
  node_modules/
  coverage/
  *.log
  ```
- [x] Buat `README.md` dengan instruksi setup project (prerequisites, env setup, cara run, cara test)
- [x] Pastikan structure TypeScript sudah benar di `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "strictNullChecks": true,
      "noImplicitAny": true,
      "esModuleInterop": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "target": "ES2021",
      "module": "commonjs"
    }
  }
  ```

---

## 2. Folder Structure & Architecture

Gunakan **Modular Clean Architecture** — setiap domain/feature adalah NestJS Module yang mandiri.

- [x] Buat struktur folder berikut:

```
src/
├── common/
│   ├── constants/          # app.constants, error-codes.constants
│   ├── decorators/         # custom decorators (@CurrentUser, @Public, dll)
│   ├── dto/                # shared DTOs (PaginationDto, CursorDto)
│   ├── exceptions/         # custom exceptions
│   ├── filters/            # global exception filters
│   ├── guards/             # global guards (JwtAuthGuard, RolesGuard)
│   ├── interceptors/       # global interceptors (TransformResponse, Logging)
│   ├── interfaces/         # shared TypeScript interfaces
│   ├── middlewares/        # HTTP middlewares
│   ├── pipes/              # custom pipes (ParseUUIDPipe, TrimPipe)
│   └── utils/              # helpers, formatters, validators
│
├── config/
│   ├── app.config.ts       # application config
│   ├── database.config.ts  # database connection config
│   ├── jwt.config.ts       # JWT options
│   ├── redis.config.ts     # Redis config
│   └── config.module.ts    # root ConfigModule setup
│
├── database/
│   ├── migrations/         # Prisma migration files
│   ├── seeds/              # seed scripts per entity
│   └── database.module.ts  # DatabaseModule setup
│
├── modules/
│   └── [feature]/
│       ├── dto/            # CreateFeatureDto, UpdateFeatureDto, ResponseFeatureDto
│       ├── entities/       # Prisma model definition (referensi ke schema.prisma)
│       ├── [feature].controller.ts
│       ├── [feature].service.ts
│       ├── [feature].repository.ts   # (opsional, jika memakai Repository Pattern)
│       └── [feature].module.ts
│
├── app.module.ts           # root AppModule
└── main.ts                 # bootstrap, global middleware, Swagger setup
```

- [x] Buat `app.module.ts` sebagai root module yang mengimpor semua feature module
- [x] Buat `src/common/interfaces/paginated-response.interface.ts` untuk standarisasi response pagination:
  ```typescript
  export interface PaginatedResponse<T> {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
  ```
- [x] Buat `src/common/interfaces/api-response.interface.ts` untuk standarisasi semua response:
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
  }
  ```

---

## 3. Code Quality & Linting

> **Catatan:** NestJS 11 sudah meng-scaffold ESLint menggunakan **flat config format** (`eslint.config.mjs`) dengan ESLint 9 + `typescript-eslint` + `eslint-plugin-prettier`. Jangan buat `.eslintrc.js` (format legacy) — update `eslint.config.mjs` yang sudah ada.

- [x] Install package tambahan yang belum ada:
  ```bash
  npm install -D eslint-plugin-import husky lint-staged \
    @commitlint/cli @commitlint/config-conventional
  ```
- [x] Update `eslint.config.mjs` — tambahkan `eslint-plugin-import` dan rules tambahan:
  ```js
  // @ts-check
  import eslint from '@eslint/js';
  import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
  import importPlugin from 'eslint-plugin-import';
  import globals from 'globals';
  import tseslint from 'typescript-eslint';

  export default tseslint.config(
    { ignores: ['eslint.config.mjs'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      plugins: { import: importPlugin },
      languageOptions: {
        globals: { ...globals.node, ...globals.jest },
        sourceType: 'commonjs',
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        'import/order': ['error', { 'newlines-between': 'always' }],
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  );
  ```
- [x] Update `.prettierrc` — NestJS scaffold hanya punya 2 opsi, lengkapi:
  ```json
  {
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100,
    "tabWidth": 2,
    "semi": true
  }
  ```
- [x] Verifikasi scripts di `package.json` sudah sesuai (NestJS scaffold sudah include, pastikan format-nya):
  ```json
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  ```
- [x] Inisialisasi husky:
  ```bash
  npx husky init
  ```
- [x] Konfigurasi `lint-staged` di `package.json`:
  ```json
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
  ```
- [x] Update hook di `.husky/pre-commit`:
  ```bash
  npx lint-staged
  ```
- [x] Buat `commitlint.config.js`:
  ```js
  module.exports = { extends: ['@commitlint/config-conventional'] };
  ```
- [x] Tambahkan hook di `.husky/commit-msg`:
  ```bash
  npx --no -- commitlint --edit $1
  ```

---

## 4. Environment Configuration

- [x] Install `@nestjs/config` dan `zod` untuk validasi env:
  ```bash
  npm install @nestjs/config zod
  ```
- [x] Buat file `.env.development`, `.env.staging`, `.env.production` (jangan di-commit), dan `.env.example` sebagai reference yang di-commit
- [x] Isi `.env.example`:
  ```env
  # App
  NODE_ENV=development
  PORT=3000
  APP_NAME=nestjs-starter

  # Database
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=secret
  DB_NAME=myapp_dev

  # JWT
  JWT_SECRET=your-super-secret-key
  JWT_ACCESS_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d

  # Redis
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_PASSWORD=

  # Storage
  AWS_S3_BUCKET=
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  AWS_REGION=ap-southeast-1
  ```
- [x] Buat `src/config/app.config.ts` dengan validasi Zod:
  ```typescript
  import { z } from 'zod';

  export const appConfig = () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
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
    return envSchema.parse(config);
  };
  ```
- [x] Setup `ConfigModule` di `app.module.ts`:
  ```typescript
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    validate, // fungsi validate dari app.config.ts — throws ZodError jika env tidak valid
    load: [appConfig, databaseConfig, jwtConfig, redisConfig],
  })
  ```
- [x] Buat config module terpisah per domain (`database.config.ts`, `jwt.config.ts`, `redis.config.ts`) menggunakan `registerAs`:
  ```typescript
  export const databaseConfig = registerAs('database', () => ({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    // ...
  }));
  ```
- [x] Tambahkan npm scripts untuk perintah yang sering digunakan di `package.json`:
  ```json
  "start:dev": "NODE_ENV=development nest start --watch",
  "start:staging": "NODE_ENV=staging node dist/main",
  "start:prod": "NODE_ENV=production node dist/main"
  ```
  > Scripts untuk migration dan seed ditambahkan di Step 6 setelah Prisma di-setup.

---

## 5. Database & ORM

> Dokumen ini menggunakan **Prisma** sebagai ORM — type-safe, auto-generated client, DX yang lebih baik, dan aktif di-maintain.

- [x] Install dependencies:
  ```bash
  npm install prisma @prisma/client
  ```
- [x] Inisialisasi Prisma:
  ```bash
  npx prisma init --datasource-provider postgresql
  ```
  Perintah ini membuat `prisma/schema.prisma`, `prisma.config.ts` (Prisma 7), dan `.env` dengan `DATABASE_URL`.
- [x] Update `.env.example` — tambahkan `DATABASE_URL` dan hapus variabel DB terpisah:
  ```env
  DATABASE_URL=postgresql://postgres:secret@localhost:5432/myapp_dev?schema=public
  ```
- [x] Update `prisma/schema.prisma` — sesuaikan dengan kebutuhan project:
  ```prisma
  generator client {
    provider = "prisma-client-js"
  }

  datasource db {
    provider = "postgresql"
    // URL dikonfigurasi via prisma.config.ts (Prisma 7)
  }

  // Contoh model dengan base fields (id, createdAt, updatedAt, deletedAt)
  model User {
    id        String    @id @default(uuid()) @db.Uuid
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    deletedAt DateTime? // soft delete

    email    String @unique
    password String

    @@map("users")
  }
  ```
  > Prisma tidak mendukung abstract base model — field `id`, `createdAt`, `updatedAt`, `deletedAt` ditambahkan manual ke setiap model. Gunakan snippet atau tools generator untuk mempercepat.
- [x] Buat `PrismaService` di `src/database/prisma.service.ts`:
  ```typescript
  import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
  import { PrismaClient } from '@prisma/client';

  @Injectable()
  export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit(): Promise<void> {
      await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
      await this.$disconnect();
    }
  }
  ```
- [x] Buat `PrismaModule` di `src/database/prisma.module.ts` — `@Global()` agar bisa di-inject tanpa import ulang:
  ```typescript
  import { Global, Module } from '@nestjs/common';
  import { PrismaService } from './prisma.service';

  @Global()
  @Module({
    providers: [PrismaService],
    exports: [PrismaService],
  })
  export class PrismaModule {}
  ```
- [x] Import `PrismaModule` di `AppModule`
- [x] Tambahkan `postinstall` script di `package.json` agar client otomatis di-generate setelah `npm install`:
  ```json
  "postinstall": "prisma generate"
  ```
- [x] Setup Docker Compose untuk development (Postgres only — Redis ditambahkan di Step 12 saat dibutuhkan):
  ```yaml
  # docker-compose.yml
  services:
    postgres:
      image: postgres:16-alpine
      environment:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: secret
        POSTGRES_DB: myapp_dev
      ports:
        - '5432:5432'
      volumes:
        - postgres_data:/var/lib/postgresql/data

  volumes:
    postgres_data:
  ```
- [x] Jalankan Docker Compose untuk local development:
  ```bash
  docker-compose up -d
  ```

---

## 6. Migrations

> Prisma memiliki migration system built-in via `prisma migrate`. Tidak perlu `data-source.ts` terpisah.
>
> **Catatan:** Seeder (admin user) **tidak dibuat di step ini** — field `role` belum ada di schema dan `bcrypt` belum terinstall. Seeder ditambahkan di Step 7 setelah RBAC dan bcrypt tersedia.

- [x] Jalankan Docker Compose jika belum berjalan:
  ```bash
  docker-compose up -d
  ```
- [x] Tambahkan scripts Prisma di `package.json`:
  ```json
  "migration:dev": "prisma migrate dev",
  "migration:deploy": "prisma migrate deploy",
  "migration:reset": "prisma migrate reset",
  "migration:status": "prisma migrate status",
  "prisma:generate": "prisma generate"
  ```
- [x] Jalankan migration pertama (setelah model didefinisikan di `schema.prisma`):
  ```bash
  npx prisma migrate dev --name init
  ```
  Perintah ini: membuat file migration di `prisma/migrations/`, menjalankan migration ke database, dan meng-generate ulang Prisma Client.
- [x] Commit file migration ke git — file di `prisma/migrations/` harus masuk version control
- [ ] **Jangan gunakan `prisma db push` di staging/production** — selalu gunakan `prisma migrate deploy`:
  ```bash
  # Staging / Production
  npx prisma migrate deploy
  ```

---

## 7. Authentication & Authorization

- [x] Install dependencies:
  ```bash
  npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
  npm install -D @types/passport-jwt @types/passport-local @types/bcrypt
  ```
- [x] Buat `AuthModule` dengan struktur lengkap:
  ```
  src/modules/auth/
  ├── dto/
  │   ├── login.dto.ts
  │   ├── register.dto.ts
  │   ├── refresh-token.dto.ts
  │   └── auth-response.dto.ts
  ├── strategies/
  │   ├── jwt.strategy.ts         # validate access token
  │   ├── jwt-refresh.strategy.ts # validate refresh token
  │   └── local.strategy.ts       # validate email/password
  ├── guards/
  │   ├── jwt-auth.guard.ts
  │   ├── jwt-refresh.guard.ts
  │   └── local-auth.guard.ts
  ├── auth.controller.ts
  ├── auth.service.ts
  └── auth.module.ts
  ```
- [x] Implementasi endpoint:
  - `POST /auth/register` — daftar user baru
  - `POST /auth/login` — login, return `accessToken` + `refreshToken`
  - `POST /auth/refresh` — gunakan refresh token untuk dapat access token baru
  - `POST /auth/logout` — revoke refresh token
  - `GET /auth/me` — get current user profile
- [x] Implementasi **JWT Access Token** (short-lived, 15 menit) + **Refresh Token** (long-lived, 7 hari):
  ```typescript
  // auth.service.ts
  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ sub: userId, email }, { expiresIn: '15m' }),
      this.jwtService.signAsync({ sub: userId, email }, {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }
  ```
- [x] Simpan **hash** dari refresh token ke database (bukan plain text)
- [x] Buat `@CurrentUser()` decorator:
  ```typescript
  export const CurrentUser = createParamDecorator(
    (data: keyof User | undefined, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return data ? request.user?.[data] : request.user;
    },
  );
  ```
- [x] Buat `@Public()` decorator untuk skip auth guard di endpoint tertentu:
  ```typescript
  export const IS_PUBLIC_KEY = 'isPublic';
  export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
  ```
- [x] Setup `JwtAuthGuard` sebagai **global guard** di `app.module.ts`:
  ```typescript
  { provide: APP_GUARD, useClass: JwtAuthGuard }
  ```
- [x] Implementasi **RBAC (Role-Based Access Control)**:
  - Buat `Role` enum: `ADMIN`, `USER`
  - Buat `@Roles(...roles)` decorator
  - Buat `RolesGuard` — cek role dari JWT payload
  - Register sebagai global guard setelah `JwtAuthGuard`
- [x] Hash password menggunakan `bcrypt` dengan salt rounds minimum 12:
  ```typescript
  const hashedPassword = await bcrypt.hash(password, 12);
  ```
- [x] Tambahkan field `role` ke model `User` di `prisma/schema.prisma` dan jalankan migration:
  ```prisma
  enum Role {
    ADMIN
    USER
  }

  model User {
    // ... field yang sudah ada ...
    role Role @default(USER)
  }
  ```
  ```bash
  npx prisma migrate dev --name add-user-role
  ```
- [x] Buat seeder admin user di `prisma/seed.ts` — **baru bisa dibuat setelah `bcrypt` dan field `role` tersedia**:
  ```typescript
  import { PrismaClient, Role } from '@prisma/client';
  import * as bcrypt from 'bcrypt';

  const prisma = new PrismaClient();

  async function main(): Promise<void> {
    // Upsert agar idempoten — aman dijalankan berkali-kali
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    console.log('Seed complete');
  }

  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
  ```
- [x] Install `@faker-js/faker` untuk generate data development:
  ```bash
  npm install -D @faker-js/faker
  ```
- [x] Tambahkan `seed` script dan `prisma.seed` config di `package.json`:
  ```json
  // scripts:
  "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts"

  // top-level:
  "prisma": {
    "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts"
  }
  ```
- [x] Jalankan seeder:
  ```bash
  npx prisma db seed
  ```

---

## 8. API Design & Swagger

- [ ] Install Swagger:
  ```bash
  npm install @nestjs/swagger swagger-ui-express
  ```
- [ ] Setup Swagger di `main.ts` — **hanya aktif di non-production**:
  ```typescript
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(process.env.APP_NAME)
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .addServer('https://api.staging.example.com', 'Staging')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }
  ```
- [ ] Dekorasi semua DTO dan controller dengan Swagger decorators:
  - `@ApiTags('auth')` di controller
  - `@ApiOperation({ summary: '...' })` di setiap endpoint
  - `@ApiResponse({ status: 200, type: ResponseDto })` untuk documented response
  - `@ApiProperty()` di setiap DTO field
  - `@ApiBearerAuth()` untuk endpoint yang butuh auth
- [ ] Buat reusable Swagger utilities di `src/common/decorators/`:
  ```typescript
  // @ApiPaginatedResponse
  export const ApiPaginatedResponse = <T>(dto: Type<T>) =>
    applyDecorators(
      ApiOkResponse({ schema: { ... } })
    );
  ```
- [ ] Gunakan **versioning** untuk API:
  ```typescript
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  // Endpoint: /v1/users, /v2/users
  ```
- [ ] Aktifkan **global prefix**:
  ```typescript
  app.setGlobalPrefix('api');
  ```
- [ ] Standardisasi response format via `TransformInterceptor`:
  ```typescript
  @Injectable()
  export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
      return next.handle().pipe(
        map(data => ({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        })),
      );
    }
  }
  ```

---

## 9. Validation & Transformation

> **Catatan:** Project ini menggunakan **Zod** untuk validasi — bukan `class-validator`. Alasannya:
> - Zod sudah terinstall (dipakai untuk env validation di Step 4)
> - Schema = TypeScript type secara otomatis, tidak perlu deklarasi terpisah
> - Lebih composable dan ekspresif dibanding decorator-based validation
> - Integrasi Swagger via `nestjs-zod` yang auto-generate docs dari Zod schema
>
> **Tidak perlu install `class-validator` atau `class-transformer`.**

- [ ] Install `nestjs-zod`:
  ```bash
  npm install nestjs-zod
  ```
- [ ] Panggil `patchNestjsSwagger()` di `main.ts` sebelum `SwaggerModule.createDocument()`:
  ```typescript
  import { patchNestjsSwagger } from 'nestjs-zod';
  patchNestjsSwagger(); // harus dipanggil sebelum createDocument
  ```
- [ ] Setup `ZodValidationPipe` secara global di `main.ts`:
  ```typescript
  import { ZodValidationPipe } from 'nestjs-zod';
  app.useGlobalPipes(new ZodValidationPipe());
  ```
- [ ] Definisikan semua DTO menggunakan `createZodDto` — schema sekaligus menjadi type dan Swagger docs:
  ```typescript
  import { z } from 'zod';
  import { createZodDto } from 'nestjs-zod';

  export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  export class RegisterDto extends createZodDto(RegisterSchema) {}
  // Swagger @ApiProperty() otomatis di-generate dari schema
  ```
- [ ] Gunakan `.trim()` dan `.transform()` langsung di Zod schema untuk normalisasi input:
  ```typescript
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(6).trim(),
  ```
- [ ] Buat shared schemas di `src/common/dto/` untuk reusable validations:
  ```typescript
  // src/common/dto/pagination.dto.ts
  export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  });
  export class PaginationDto extends createZodDto(PaginationSchema) {}
  ```
- [ ] Buat `ParseUUIDPipe` custom dengan pesan error yang jelas untuk path params:
  ```typescript
  // src/common/pipes/parse-uuid.pipe.ts
  import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
  import { z } from 'zod';

  @Injectable()
  export class ParseUUIDPipe implements PipeTransform {
    transform(value: unknown): string {
      const result = z.string().uuid().safeParse(value);
      if (!result.success) throw new BadRequestException('Invalid UUID format');
      return result.data;
    }
  }
  ```

---

## 10. Error Handling & Exception Filters

- [ ] Buat `src/common/exceptions/` dengan custom exceptions:
  ```typescript
  export class BusinessException extends HttpException {
    constructor(message: string, status: HttpStatus, public readonly code: string) {
      super({ message, code }, status);
    }
  }

  export class ResourceNotFoundException extends BusinessException {
    constructor(resource: string, id: string) {
      super(`${resource} with id '${id}' not found`, HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND');
    }
  }

  export class DuplicateResourceException extends BusinessException {
    constructor(resource: string, field: string) {
      super(`${resource} with this ${field} already exists`, HttpStatus.CONFLICT, 'DUPLICATE_RESOURCE');
    }
  }
  ```
- [ ] Buat `GlobalExceptionFilter` di `src/common/filters/global-exception.filter.ts`:
  ```typescript
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let code = 'INTERNAL_ERROR';

      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exRes = exception.getResponse();
        message = typeof exRes === 'object' ? (exRes as any).message : exRes;
        code = typeof exRes === 'object' ? (exRes as any).code : 'HTTP_EXCEPTION';
      }

      // Log dan kirim ke monitoring
      response.status(status).json({
        success: false,
        error: { code, message },
        path: request.url,
        timestamp: new Date().toISOString(),
      });
    }
  }
  ```
- [ ] Register `GlobalExceptionFilter` secara global di `main.ts`:
  ```typescript
  app.useGlobalFilters(new GlobalExceptionFilter());
  ```
- [ ] Handle **Prisma errors** di dalam filter — tangkap `PrismaClientKnownRequestError` dengan codes:
  - `P2002` → unique constraint violation (duplicate key) → `409 Conflict`
  - `P2025` → record not found → `404 Not Found`
- [ ] Handle **ValidationPipe errors** agar format response konsisten dengan error lainnya
- [ ] Buat `src/common/constants/error-codes.constants.ts` — centralized error code registry

---

## 11. Logging

- [ ] Install `winston` + NestJS winston transport:
  ```bash
  npm install nest-winston winston winston-daily-rotate-file
  ```
- [ ] Setup `WinstonModule` di `app.module.ts`:
  ```typescript
  WinstonModule.forRoot({
    transports: [
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
      }),
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d',
      }),
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
      }),
    ],
  })
  ```
- [ ] Buat `LoggingInterceptor` untuk log setiap incoming request + response time:
  ```typescript
  @Injectable()
  export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const { method, url } = request;
      const start = Date.now();

      return next.handle().pipe(
        tap(() => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${url} - ${ms}ms`);
        }),
      );
    }
  }
  ```
- [ ] Log ke file di production, console di development
- [ ] **Jangan log** sensitive data: password, token, PII (nama, email, nomor telp)
- [ ] Setup **request ID** (`x-request-id`) di setiap log untuk tracing:
  ```bash
  npm install uuid
  ```
  Inject `requestId` ke setiap log context via middleware
- [ ] (opsional) Integrasikan dengan **Datadog**, **New Relic**, atau **Grafana Loki** di production

---

## 12. Caching

- [ ] Install Redis + NestJS cache manager:
  ```bash
  npm install @nestjs/cache-manager cache-manager ioredis
  npm install -D @types/cache-manager
  ```
- [ ] Setup `CacheModule` secara global di `app.module.ts`:
  ```typescript
  CacheModule.registerAsync({
    isGlobal: true,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      store: new IoRedis({
        host: config.get('redis.host'),
        port: config.get('redis.port'),
        password: config.get('redis.password'),
      }),
      ttl: 60 * 1000, // default 60 detik
    }),
  })
  ```
- [ ] Gunakan `@CacheKey()` + `@CacheTTL()` di controller untuk caching response HTTP
- [ ] Inject `CACHE_MANAGER` di service untuk manual cache control:
  ```typescript
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCachedUser(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) return cached;
    const user = await this.usersRepo.findOne({ where: { id } });
    await this.cacheManager.set(cacheKey, user, 300_000); // 5 menit
    return user;
  }
  ```
- [ ] Buat **cache invalidation strategy** — clear cache terkait saat data diupdate/didelete
- [ ] Buat `CacheService` abstraction agar mudah diganti implementasinya
- [ ] Gunakan Redis juga sebagai **rate limiting store** (lihat Security section)
- [ ] Monitor Redis memory usage — set `maxmemory-policy allkeys-lru`

---

## 13. Queue & Background Jobs

- [ ] Install BullMQ:
  ```bash
  npm install @nestjs/bullmq bullmq ioredis
  ```
- [ ] Setup `BullModule` di `app.module.ts`:
  ```typescript
  BullModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      connection: {
        host: config.get('redis.host'),
        port: config.get('redis.port'),
      },
    }),
  })
  ```
- [ ] Buat queue untuk setiap domain yang butuh async processing:
  ```
  src/modules/
  ├── mail/
  │   ├── mail.processor.ts    # @Processor('mail-queue')
  │   ├── mail.service.ts      # enqueue jobs
  │   └── mail.module.ts
  ```
- [ ] Implementasi job processor:
  ```typescript
  @Processor('mail-queue')
  export class MailProcessor extends WorkerHost {
    @Process('send-welcome-email')
    async handleWelcomeEmail(job: Job<{ userId: string }>) {
      // implementasi kirim email
    }
  }
  ```
- [ ] Tambahkan **retry strategy** dengan exponential backoff:
  ```typescript
  await this.mailQueue.add('send-email', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
  ```
- [ ] Setup **Bull Board** untuk monitoring queue di development:
  ```bash
  npm install @bull-board/express @bull-board/api
  ```
- [ ] Buat scheduled jobs menggunakan `@nestjs/schedule`:
  ```bash
  npm install @nestjs/schedule
  ```
  ```typescript
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup(): Promise<void> {
    await this.cleanupExpiredTokens();
  }
  ```

---

## 14. File Upload & Storage

- [ ] Install Multer dan AWS SDK (atau gunakan MinIO untuk self-hosted):
  ```bash
  npm install @nestjs/platform-express multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
  npm install -D @types/multer
  ```
- [ ] Buat `StorageModule` dengan abstraction untuk mudah ganti provider:
  ```typescript
  abstract class StorageService {
    abstract upload(file: Express.Multer.File, path: string): Promise<string>;
    abstract delete(key: string): Promise<void>;
    abstract getSignedUrl(key: string, expiresIn: number): Promise<string>;
  }
  ```
- [ ] Implementasi `S3StorageService` dan `LocalStorageService` (untuk development)
- [ ] Validasi file di level endpoint:
  ```typescript
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {}
  ```
- [ ] Scan file dengan antivirus (e.g. ClamAV) sebelum disimpan di production
- [ ] Jangan ekspos path/bucket S3 langsung ke client — gunakan **signed URL** dengan expiry
- [ ] Simpan metadata file (originalName, size, mimeType, key) ke database

---

## 15. Email & Notifications

- [ ] Install Nodemailer + template engine:
  ```bash
  npm install nodemailer @nestjs-modules/mailer handlebars
  npm install -D @types/nodemailer
  ```
- [ ] Setup `MailerModule`:
  ```typescript
  MailerModule.forRootAsync({
    useFactory: (config: ConfigService) => ({
      transport: {
        host: config.get('mail.host'),
        port: config.get('mail.port'),
        auth: {
          user: config.get('mail.user'),
          pass: config.get('mail.password'),
        },
      },
      defaults: { from: `"${config.get('app.name')}" <noreply@example.com>` },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
  })
  ```
- [ ] Buat `MailService` yang men-queue semua pengiriman email (jangan kirim synchronous):
  ```typescript
  async sendWelcomeEmail(user: User): Promise<void> {
    await this.mailQueue.add('welcome', { userId: user.id, email: user.email });
  }
  ```
- [ ] Buat template email HTML yang responsive di `src/modules/mail/templates/`:
  - `welcome.hbs` — selamat datang
  - `reset-password.hbs` — reset password
  - `verify-email.hbs` — verifikasi email
- [ ] Setup **email preview** di development (gunakan [Mailpit](https://mailpit.axllent.org/) atau Mailtrap):
  ```yaml
  # docker-compose.yml tambahkan:
  mailpit:
    image: axllent/mailpit
    ports:
      - '1025:1025'   # SMTP
      - '8025:8025'   # Web UI
  ```
- [ ] (opsional) Buat abstraction `NotificationService` yang support multiple channel:
  - Email via SMTP / SendGrid / SES
  - Push notification via FCM
  - SMS via Twilio / AWS SNS

---

## 16. WebSocket / Real-time

- [ ] Install Socket.io adapter:
  ```bash
  npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
  ```
- [ ] Buat `EventsGateway`:
  ```typescript
  @WebSocketGateway({
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
    namespace: 'events',
  })
  export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
      // validate JWT dari handshake, disconnect jika invalid
    }
  }
  ```
- [ ] Implementasi **JWT authentication** untuk WebSocket connection:
  ```typescript
  // Di handleConnection, validate token dari client.handshake.auth.token
  const token = client.handshake.auth?.token;
  const payload = await this.jwtService.verifyAsync(token);
  client.data.userId = payload.sub;
  ```
- [ ] Gunakan **rooms** untuk scope broadcast ke user/group tertentu:
  ```typescript
  // Saat user connect, join ke personal room
  client.join(`user:${userId}`);

  // Kirim notifikasi ke user spesifik
  this.server.to(`user:${userId}`).emit('notification', payload);
  ```
- [ ] Buat `EventsModule` yang dapat digunakan di module lain untuk emit events
- [ ] (opsional) Gunakan Redis adapter untuk mendukung **multiple instances / horizontal scaling**:
  ```bash
  npm install @socket.io/redis-adapter
  ```

---

## 17. Testing Setup

- [ ] Setup struktur folder test yang mirror `src/`:
  ```
  test/
  ├── e2e/                          # end-to-end tests
  │   ├── auth.e2e-spec.ts
  │   └── users.e2e-spec.ts
  └── helpers/
      ├── test-database.helper.ts   # setup in-memory / test DB
      ├── mock-factories.ts         # factory functions untuk test data
      └── auth.helper.ts            # helper untuk generate valid JWT di test
  ```
- [ ] NestJS sudah include `jest` + `supertest` di default setup. Tambahkan:
  ```bash
  npm install -D @faker-js/faker jest-mock-extended
  ```
- [ ] Konfigurasi Jest di `jest.config.js`:
  ```js
  module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    coverageDirectory: '../coverage',
    collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts', '!**/main.ts'],
    coverageThreshold: {
      global: { lines: 70, functions: 70, branches: 60 },
    },
  };
  ```
- [ ] **Unit Tests** — test setiap service secara terisolasi dengan mock dependencies:
  ```typescript
  describe('AuthService', () => {
    let service: AuthService;
    let usersService: MockType<UsersService>;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: UsersService, useFactory: mockFactory },
        ],
      }).compile();
      service = module.get(AuthService);
    });
  });
  ```
- [ ] **Integration Tests** — test module secara keseluruhan dengan real database:
  ```typescript
  // Gunakan test database terpisah atau Docker Compose test service
  // Prisma tidak mendukung SQLite in-memory untuk PostgreSQL schema
  // Setup: DATABASE_URL=postgresql://...myapp_test di environment test
  beforeAll(async () => { await prisma.$executeRaw`TRUNCATE ...`; });
  ```
- [ ] **E2E Tests** — test full HTTP request cycle dengan `supertest`:
  ```typescript
  describe('POST /api/v1/auth/login', () => {
    it('should return tokens on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
    });
  });
  ```
- [ ] Buat `TestDatabaseHelper` yang setup dan teardown test database otomatis
- [ ] Setup `jest --runInBand` untuk E2E tests agar tidak race condition
- [ ] Tambahkan scripts di `package.json`:
  ```json
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json --runInBand"
  ```
  > Jalankan dengan: `npm test`, `npm run test:cov`, `npm run test:e2e`
- [ ] Target minimum coverage: **70%** untuk service layer, **80%** untuk critical path (auth, payment)

---

## 18. CI/CD Pipeline

- [ ] Setup **GitHub Actions** dengan workflow berikut:

  ### `ci.yml` — runs on every PR ke `develop` dan `main`
  ```yaml
  name: CI
  on:
    pull_request:
      branches: [develop, main]
  jobs:
    test:
      runs-on: ubuntu-latest
      services:
        postgres:
          image: postgres:16
          env:
            POSTGRES_PASSWORD: secret
            POSTGRES_DB: myapp_test
          ports: ['5432:5432']
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: 'npm' }
        - run: npm ci
        - run: npm run lint
        - run: npm run test:cov
        - run: npm run test:e2e
        - uses: codecov/codecov-action@v4
  ```

  ### `cd-staging.yml` — runs on push ke `develop`
  ```yaml
  - name: Build Docker image
    run: docker build -t myapp:staging .
  - name: Deploy to staging
    run: # deploy ke server/ECS/Railway/Fly.io
  - name: Run migrations
    run: docker exec ... npm run migration:run
  ```

  ### `cd-production.yml` — runs on push ke `main` / tag `v*`
  ```yaml
  - name: Build & push to registry
  - name: Deploy to production (blue-green atau rolling)
  - name: Run migrations
  - name: Health check
  - name: Notify Slack
  ```

- [ ] Simpan secrets di GitHub Secrets:
  - `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`
  - `DOCKER_REGISTRY_TOKEN`
  - `DEPLOY_SSH_KEY`
  - `SLACK_WEBHOOK_URL`
- [ ] Buat `Dockerfile` multi-stage untuk image production yang lean:
  ```dockerfile
  # Build stage
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  # Production stage
  FROM node:20-alpine AS production
  WORKDIR /app
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  EXPOSE 3000
  CMD ["node", "dist/main"]
  ```
- [ ] Buat `.dockerignore`:
  ```
  node_modules
  .git
  .env*
  coverage
  dist
  npm-debug.log*
  ```
- [ ] Tambahkan Docker Compose override untuk production:
  ```yaml
  # docker-compose.prod.yml
  services:
    app:
      image: myapp:latest
      restart: always
      env_file: .env.production
  ```

---

## 19. Security Hardening

- [ ] Install security packages:
  ```bash
  npm install helmet @nestjs/throttler
  ```
- [ ] Setup `helmet` di `main.ts` untuk set HTTP security headers:
  ```typescript
  app.use(helmet());
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
  ```
- [ ] Setup `ThrottlerModule` untuk **rate limiting**:
  ```typescript
  ThrottlerModule.forRoot([
    { name: 'short', ttl: 1000, limit: 10 },    // 10 req/detik
    { name: 'long', ttl: 60000, limit: 100 },   // 100 req/menit
  ])
  // Gunakan Redis store untuk multi-instance
  ```
- [ ] Buat rate limit yang lebih ketat di endpoint auth:
  ```typescript
  @Throttle({ short: { ttl: 60000, limit: 5 } })  // max 5 login attempts/menit
  @Post('login')
  async login() {}
  ```
- [ ] Setup **CORS** dengan origin whitelist:
  ```typescript
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  ```
- [ ] Aktifkan **HTTPS only** di production — gunakan reverse proxy (Nginx/Caddy) dengan TLS
- [ ] Implementasi **SQL Injection prevention** — gunakan parameterized queries / ORM (jangan raw SQL dengan interpolasi)
- [ ] Implementasi **input sanitization** — strip HTML/script tags dari input teks bebas:
  ```bash
  npm install sanitize-html
  ```
- [ ] Aktifkan **audit logging** untuk aksi sensitif (login, password change, delete):
  ```typescript
  // Simpan ke tabel audit_logs: userId, action, resource, ip, userAgent, timestamp
  ```
- [ ] Buat `HttpsRedirectMiddleware` — redirect HTTP ke HTTPS di production
- [ ] Setup **secrets rotation** — JWT secret, DB password harus bisa dirotate tanpa downtime
- [ ] Review dan minimasi dependencies — jalankan `npm audit` secara rutin:
  ```bash
  npm audit --audit-level=high
  ```
- [ ] Jangan ekspos **stack trace** di production response
- [ ] Setup **Content Security Policy (CSP)** jika backend juga serve web views

---

## 20. Performance Optimization

- [ ] Aktifkan **compression** di `main.ts`:
  ```bash
  npm install compression
  npm install -D @types/compression
  ```
  ```typescript
  app.use(compression());
  ```
- [ ] Implementasi **database connection pooling** — konfigurasi via `DATABASE_URL` Prisma:
  ```env
  DATABASE_URL=postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=30
  ```
- [ ] Optimalkan query database:
  - Gunakan `select` untuk hanya ambil kolom yang dibutuhkan
  - Tambahkan **database indexes** di kolom yang sering di-query (foreign keys, email, createdAt)
  - Hindari **N+1 queries** — gunakan `JOIN` atau `DataLoader` pattern
  - Gunakan `.explain()` / `EXPLAIN ANALYZE` untuk profiling query lambat
- [ ] Implementasi **pagination** di semua endpoint yang return list:
  - Cursor-based pagination untuk feed/timeline (lebih efisien untuk dataset besar)
  - Offset-based pagination untuk admin/backoffice (lebih intuitif)
- [ ] Gunakan `SELECT FOR UPDATE SKIP LOCKED` untuk distributed job processing
- [ ] Setup **database read replica** untuk query-heavy endpoints di production
- [ ] Profile dan optimasi startup time — lazy-load module yang berat jika memungkinkan
- [ ] Monitor memory usage — set `--max-old-space-size` sesuai container limit:
  ```dockerfile
  CMD ["node", "--max-old-space-size=512", "dist/main"]
  ```
- [ ] Setup **health check endpoint** untuk load balancer + monitoring:
  ```bash
  npm install @nestjs/terminus
  ```
  ```typescript
  // GET /health → { status: 'ok', info: { database: { status: 'up' }, redis: { status: 'up' } } }
  ```
- [ ] Setup **graceful shutdown** — handle `SIGTERM` dengan benar:
  ```typescript
  app.enableShutdownHooks();
  ```
  Beri waktu untuk requests in-flight selesai sebelum menutup koneksi
- [ ] Ukur dan target **response time** < 200ms untuk endpoint umum (p95)
- [ ] Setup **APM (Application Performance Monitoring)**: Datadog, New Relic, atau OpenTelemetry

---

## Dependencies Summary

```json
// package.json — Production Dependencies
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "zod": "^3.0.0",

    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",

    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.0.0",

    "@nestjs/swagger": "^7.0.0",
    "swagger-ui-express": "^5.0.0",

    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",

    "@nestjs/cache-manager": "^2.0.0",
    "cache-manager": "^5.0.0",
    "ioredis": "^5.0.0",

    "@nestjs/bullmq": "^10.0.0",
    "bullmq": "^5.0.0",

    "@nestjs/schedule": "^4.0.0",

    "@nestjs-modules/mailer": "^2.0.0",
    "nodemailer": "^6.0.0",
    "handlebars": "^4.0.0",

    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "socket.io": "^4.0.0",

    "@nestjs/terminus": "^10.0.0",
    "@nestjs/throttler": "^6.0.0",
    "helmet": "^7.0.0",
    "compression": "^1.0.0",

    "nest-winston": "^1.9.0",
    "winston": "^3.0.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/compression": "^1.0.0",
    "@types/multer": "^1.0.0",
    "@types/nodemailer": "^6.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "@faker-js/faker": "^8.0.0",
    "jest-mock-extended": "^3.0.0",
    "supertest": "^7.0.0"
  }
}
```

---

## Branching Strategy

```
main          ← production code, protected branch
develop       ← integration branch
feature/*     ← new features (merge ke develop)
bugfix/*      ← bug fixes (merge ke develop)
hotfix/*      ← urgent fix (merge ke main + develop)
release/*     ← release preparation
```

---

## Definition of Done (per Feature/Module)

Sebuah module dianggap selesai jika:

- [ ] Unit tests untuk semua service methods lulus
- [ ] E2E tests untuk semua endpoint lulus
- [ ] `npm run lint` tanpa error dan warning
- [ ] Semua endpoint terdokumentasi di Swagger
- [ ] Request/Response DTO lengkap dengan validasi dan Swagger decorators
- [ ] Error cases di-handle dengan exception yang tepat (bukan throw Error generic)
- [ ] Tidak ada hardcoded credentials / config values (semua dari `ConfigService`)
- [ ] Migration dibuat untuk setiap perubahan skema database
- [ ] Logging ditambahkan di titik-titik kritis (service layer, bukan controller)
- [ ] Rate limiting diterapkan di endpoint yang publik atau sensitif
- [ ] Sudah ditest di environment staging sebelum merge ke main
- [ ] Code review sudah dilakukan (min. 1 reviewer)

---

*Last updated: March 2026*
*Version: 1.0.0*

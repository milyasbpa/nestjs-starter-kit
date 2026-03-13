# NestJS Starter Kit

A professional, production-ready NestJS backend starter kit.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd nestjs-starter-kit
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.development
# Edit .env.development sesuai kebutuhan
```

### 3. Run Development Server

```bash
npm run start:dev
```

Server akan berjalan di `http://localhost:3000`.

## Available Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Run in watch mode (development) |
| `npm run start:prod` | Run compiled production build |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Lint & auto-fix TypeScript files |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |

## Project Structure

```
src/
├── common/         # Shared decorators, filters, guards, interceptors, pipes
├── config/         # Environment & module configs
├── database/       # Migrations & seeds
├── modules/        # Feature modules (auth, users, etc.)
├── app.module.ts   # Root module
└── main.ts         # Bootstrap
```

## Environment Variables

Lihat [.env.example](.env.example) untuk daftar lengkap variabel yang dibutuhkan.

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + TypeORM
- **Auth**: JWT (access + refresh token)
- **Docs**: Swagger / OpenAPI
- **Queue**: BullMQ + Redis
- **Cache**: Redis

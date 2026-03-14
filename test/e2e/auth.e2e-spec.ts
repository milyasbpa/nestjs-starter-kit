import * as http from 'http';

import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { createTestApp, getPrisma } from '../helpers/test-app.helper';

interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function body<T>(res: request.Response): ApiResponse<T> {
  return res.body as ApiResponse<T>;
}

/**
 * Auth E2E Tests
 *
 * Requires a running PostgreSQL instance with the test database configured
 * in .env.test. Run migrations first:
 *   NODE_ENV=test npx prisma migrate deploy
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  const BASE = '/api/v1/auth';

  // Test user seeded before all tests run
  const TEST_USER = {
    email: 'e2e.auth@example.com',
    password: 'testpass123',
  };
  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as http.Server;
    const prisma = getPrisma(app);

    // Upsert test user so tests are idempotent
    const hashed = await bcrypt.hash(TEST_USER.password, 12);
    await prisma.user.upsert({
      where: { email: TEST_USER.email },
      update: { password: hashed, refreshTokenHash: null },
      create: { email: TEST_USER.email, password: hashed },
    });
  });

  afterAll(async () => {
    const prisma = getPrisma(app);
    // Remove test user
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
    await app.close();
  });

  // ─── POST /auth/register ────────────────────────────────────────────────
  describe('POST /auth/register', () => {
    const REG_EMAIL = 'e2e.register@example.com';

    afterEach(async () => {
      // Clean up any registered user so tests are isolated
      const prisma = getPrisma(app);
      await prisma.user.deleteMany({ where: { email: REG_EMAIL } });
    });

    it('should register a new user and return tokens (201)', async () => {
      const res = await request(server)
        .post(`${BASE}/register`)
        .send({ email: REG_EMAIL, password: 'secure123' })
        .expect(201);

      const b = body<AuthTokens>(res);
      expect(b.success).toBe(true);
      expect(b.data).toHaveProperty('accessToken');
      expect(b.data).toHaveProperty('refreshToken');
    });

    it('should return 409 when email is already taken', async () => {
      // Register once
      await request(server)
        .post(`${BASE}/register`)
        .send({ email: REG_EMAIL, password: 'secure123' });

      // Try again with same email
      const res = await request(server)
        .post(`${BASE}/register`)
        .send({ email: REG_EMAIL, password: 'secure123' })
        .expect(409);

      expect(body(res).success).toBe(false);
    });

    it('should return 422 on invalid payload (missing password)', async () => {
      const res = await request(server)
        .post(`${BASE}/register`)
        .send({ email: REG_EMAIL })
        .expect(422);

      expect(body(res).success).toBe(false);
    });

    it('should return 422 on invalid email format', async () => {
      await request(server)
        .post(`${BASE}/register`)
        .send({ email: 'not-an-email', password: 'secure123' })
        .expect(422);
    });
  });

  // ─── POST /auth/login ────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('should return tokens on valid credentials (200)', async () => {
      const res = await request(server).post(`${BASE}/login`).send(TEST_USER).expect(200);

      const b = body<AuthTokens>(res);
      expect(b.success).toBe(true);
      expect(b.data).toHaveProperty('accessToken');
      expect(b.data).toHaveProperty('refreshToken');
    });

    it('should return 401 on wrong password', async () => {
      const res = await request(server)
        .post(`${BASE}/login`)
        .send({ email: TEST_USER.email, password: 'wrongpassword' })
        .expect(401);

      expect(body(res).success).toBe(false);
    });

    it('should return 401 on non-existent user', async () => {
      await request(server)
        .post(`${BASE}/login`)
        .send({ email: 'nobody@example.com', password: 'somepass' })
        .expect(401);
    });

    it('should return 401 on missing password (LocalAuthGuard intercepts before validation)', async () => {
      await request(server).post(`${BASE}/login`).send({ email: TEST_USER.email }).expect(401);
    });
  });

  // ─── GET /auth/me ────────────────────────────────────────────────────────
  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(server).post(`${BASE}/login`).send(TEST_USER);
      accessToken = body<AuthTokens>(res).data.accessToken;
    });

    it('should return current user profile (200)', async () => {
      const res = await request(server)
        .get(`${BASE}/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const b = body<{ email: string }>(res);
      expect(b.success).toBe(true);
      expect(b.data.email).toBe(TEST_USER.email);
      expect(b.data).not.toHaveProperty('password');
      expect(b.data).not.toHaveProperty('refreshTokenHash');
    });

    it('should return 401 without token', async () => {
      await request(server).get(`${BASE}/me`).expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(server)
        .get(`${BASE}/me`)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ─── POST /auth/refresh ──────────────────────────────────────────────────
  // Note: The refresh endpoint reads the token from the request BODY as { refreshToken },
  // NOT from the Authorization header (see JwtRefreshStrategy configuration).
  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(server).post(`${BASE}/login`).send(TEST_USER);
      refreshToken = body<AuthTokens>(res).data.refreshToken;
    });

    it('should return new tokens on valid refresh token (200)', async () => {
      const res = await request(server).post(`${BASE}/refresh`).send({ refreshToken }).expect(200);

      const b = body<AuthTokens>(res);
      expect(b.success).toBe(true);
      expect(b.data).toHaveProperty('accessToken');
      expect(b.data).toHaveProperty('refreshToken');
    });

    it('should return 401 without token', async () => {
      await request(server).post(`${BASE}/refresh`).send({}).expect(401);
    });
  });

  // ─── POST /auth/logout ───────────────────────────────────────────────────
  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(server).post(`${BASE}/login`).send(TEST_USER);
      const tokens = body<AuthTokens>(res).data;
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    });

    it('should logout and revoke refresh token (204)', async () => {
      // Logout
      await request(server)
        .post(`${BASE}/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Refresh should now fail
      await request(server).post(`${BASE}/refresh`).send({ refreshToken }).expect(401);
    });

    it('should return 401 when not authenticated', async () => {
      await request(server).post(`${BASE}/logout`).expect(401);
    });
  });
});

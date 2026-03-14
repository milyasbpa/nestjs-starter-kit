/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { createMockUser } from '../../../test/helpers/mock-factories';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;
  let configService: DeepMockProxy<ConfigService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  // ─── validateUser ────────────────────────────────────────────────────────
  describe('validateUser', () => {
    it('should return null when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('notfound@example.com', 'anypass');

      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      const hashedPw = await bcrypt.hash('correctpw', 12);
      const user = createMockUser({ password: hashedPw });
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser(user.email, 'wrongpw');

      expect(result).toBeNull();
    });

    it('should return the user when credentials are valid', async () => {
      const plainPw = 'mypassword123';
      const hashedPw = await bcrypt.hash(plainPw, 12);
      const user = createMockUser({ password: hashedPw });
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser(user.email, plainPw);

      expect(result).toEqual(user);
    });
  });

  // ─── register ────────────────────────────────────────────────────────────
  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      const existing = createMockUser();
      prisma.user.findUnique.mockResolvedValue(existing);

      await expect(
        service.register({ email: existing.email, password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user with hashed password and return tokens', async () => {
      const newUser = createMockUser({ role: Role.USER });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newUser);
      prisma.user.update.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue('mock_token');
      configService.get.mockReturnValue('15m');

      const result = await service.register({ email: newUser.email, password: 'password123' });

      expect(prisma.user.create).toHaveBeenCalled();
      // verify password was hashed — the create call should NOT have plain password
      const createCallData = prisma.user.create.mock.calls[0][0].data;
      expect(createCallData.password).not.toBe('password123');
      expect(createCallData.password).toMatch(/^\$2[ab]\$/); // bcrypt hash prefix
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = createMockUser();
      prisma.user.update.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('mock_token');
      configService.get.mockReturnValue('15m');

      const result = await service.login(user.id, user.email, user.role);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  // ─── refresh ─────────────────────────────────────────────────────────────
  describe('refresh', () => {
    it('should throw UnauthorizedException when user has no stored refresh token', async () => {
      const user = createMockUser({ refreshTokenHash: null });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.refresh(user.id, user.email, user.role, 'some_refresh_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when refresh token does not match hash', async () => {
      const storedHash = await bcrypt.hash('real_refresh_token', 10);
      const user = createMockUser({ refreshTokenHash: storedHash });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.refresh(user.id, user.email, user.role, 'wrong_refresh_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return new tokens when refresh token is valid', async () => {
      const plainRefreshToken = 'valid_refresh_token';
      const storedHash = await bcrypt.hash(plainRefreshToken, 10);
      const user = createMockUser({ refreshTokenHash: storedHash });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('new_token');
      configService.get.mockReturnValue('15m');

      const result = await service.refresh(user.id, user.email, user.role, plainRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should clear the refreshTokenHash', async () => {
      const user = createMockUser();
      prisma.user.update.mockResolvedValue({ ...user, refreshTokenHash: null });

      await service.logout(user.id);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
    });
  });

  // ─── getProfile ───────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('should return selected user fields', async () => {
      const user = createMockUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile(user.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
        select: { id: true, email: true, role: true, createdAt: true },
      });
      expect(result).toEqual(user);
    });

    it('should return null when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});

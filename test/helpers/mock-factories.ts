import { User, Role } from '@prisma/client';

let userCounter = 0;

/**
 * Creates a mock User object with optional overrides.
 * Password is NOT hashed — use bcrypt.hash() in tests that need it.
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const id = ++userCounter;
  return {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
    email: `user${id}@example.com`,
    password: 'hashed_password_placeholder',
    role: Role.USER,
    refreshTokenHash: null,
    deletedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a mock admin User.
 */
export function createMockAdminUser(overrides: Partial<User> = {}): User {
  return createMockUser({ role: Role.ADMIN, ...overrides });
}

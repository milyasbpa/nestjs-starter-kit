import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

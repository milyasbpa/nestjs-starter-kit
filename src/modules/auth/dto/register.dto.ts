import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(6).trim(),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

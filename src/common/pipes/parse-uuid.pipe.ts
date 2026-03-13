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

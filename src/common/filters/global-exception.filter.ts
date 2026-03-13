import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

import { ERROR_CODES } from '../constants/error-codes.constants';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code: string = ERROR_CODES.INTERNAL_ERROR;

    if (exception instanceof ZodValidationException) {
      // Zod validation errors from ZodValidationPipe
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = ERROR_CODES.VALIDATION_ERROR;
      const zodError = exception.getZodError() as ZodError;
      message = zodError.issues.map((e) => `${e.path.join('.') || 'value'}: ${e.message}`);
    } else if (exception instanceof HttpException) {
      // NestJS HttpException (includes BusinessException)
      status = exception.getStatus();
      const exRes = exception.getResponse();

      if (typeof exRes === 'object' && exRes !== null) {
        const res = exRes as Record<string, unknown>;
        message = (res['message'] as string | string[]) ?? exception.message;
        code = (res['code'] as string) ?? ERROR_CODES.HTTP_EXCEPTION;
      } else {
        message = exRes;
        code = ERROR_CODES.HTTP_EXCEPTION;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma known errors
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = ERROR_CODES.DB_UNIQUE_CONSTRAINT;
        message = 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = ERROR_CODES.DB_RECORD_NOT_FOUND;
        message = 'Record not found';
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} — ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

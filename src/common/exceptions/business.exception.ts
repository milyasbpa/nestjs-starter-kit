import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_CODES } from '../constants/error-codes.constants';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly code: string,
  ) {
    super({ message, code }, status);
  }
}

export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, id: string) {
    super(
      `${resource} with id '${id}' not found`,
      HttpStatus.NOT_FOUND,
      ERROR_CODES.RESOURCE_NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends BusinessException {
  constructor(resource: string, field: string) {
    super(
      `${resource} with this ${field} already exists`,
      HttpStatus.CONFLICT,
      ERROR_CODES.DUPLICATE_RESOURCE,
    );
  }
}

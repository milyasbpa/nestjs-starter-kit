import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <T>(dto: Type<T>): MethodDecorator =>
  applyDecorators(
    ApiExtraModels(dto),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
              data: {
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: getSchemaPath(dto) },
                  },
                  meta: {
                    properties: {
                      total: { type: 'number', example: 100 },
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      totalPages: { type: 'number', example: 10 },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );

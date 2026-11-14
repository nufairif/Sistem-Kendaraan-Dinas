export const idPathParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
  example: 1,
  description: 'ID numerik record',
}

export function successSchema(
  dataSchema: Record<string, unknown>,
  includeMeta = false
) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: dataSchema,
      ...(includeMeta
        ? {
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 3 },
              },
            },
          }
        : {}),
    },
  }
}

export function jsonResponse(
  description: string,
  schema: Record<string, unknown>,
  example: unknown
) {
  return {
    description,
    content: {
      'application/json': {
        schema,
        example,
      },
    },
  }
}

export const protectedReadResponses = {
  401: { $ref: '#/components/responses/Unauthorized' },
  500: { $ref: '#/components/responses/InternalServerError' },
}

export const protectedWriteResponses = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  500: { $ref: '#/components/responses/InternalServerError' },
}

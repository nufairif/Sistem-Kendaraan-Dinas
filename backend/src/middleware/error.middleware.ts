import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { HttpError } from '../lib/httpError'

export interface ErrorEnvelope {
  success: false
  message: string
  error: {
    code: string
    details?: unknown
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
    },
  } satisfies ErrorEnvelope)
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    } satisfies ErrorEnvelope)
    return
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }))
    res.status(400).json({
      success: false,
      message: fieldErrors[0]?.message ?? 'Validasi input gagal.',
      error: {
        code: 'VALIDATION_ERROR',
        details: fieldErrors,
      },
    } satisfies ErrorEnvelope)
    return
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Format JSON pada request body tidak valid.',
      error: {
        code: 'INVALID_JSON',
      },
    } satisfies ErrorEnvelope)
    return
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large'
  ) {
    res.status(413).json({
      success: false,
      message: 'Ukuran payload JSON melebihi batas maksimum server (15 MB).',
      error: {
        code: 'PAYLOAD_TOO_LARGE',
      },
    } satisfies ErrorEnvelope)
    return
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Data duplikat terdeteksi pada kolom unik.',
        error: {
          code: 'DUPLICATE_ENTRY',
          details: err.meta,
        },
      } satisfies ErrorEnvelope)
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Data yang diminta tidak ditemukan.',
        error: {
          code: 'NOT_FOUND',
        },
      } satisfies ErrorEnvelope)
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'Referensi relasi data (foreign key) tidak valid.',
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
        },
      } satisfies ErrorEnvelope)
      return
    }
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
    },
  } satisfies ErrorEnvelope)
}

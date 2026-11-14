import type { Response } from 'express'

export interface SuccessEnvelope<T> {
  success: true
  message: string
  data: T
  meta?: Record<string, unknown>
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'OK',
  statusCode = 200,
  meta?: Record<string, unknown>
): Response<SuccessEnvelope<T>> {
  const payload: SuccessEnvelope<T> = {
    success: true,
    message,
    data,
  }
  if (meta !== undefined) {
    payload.meta = meta
  }
  return res.status(statusCode).json(payload)
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Data berhasil dibuat.'
): Response<SuccessEnvelope<T>> {
  return sendSuccess(res, data, message, 201)
}

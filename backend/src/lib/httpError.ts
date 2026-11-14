export class HttpError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Autentikasi diperlukan. Silakan login terlebih dahulu.') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Anda tidak memiliki hak akses untuk melakukan aksi ini.') {
    super(403, 'FORBIDDEN', message)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Data tidak ditemukan.') {
    super(404, 'NOT_FOUND', message)
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details)
  }
}

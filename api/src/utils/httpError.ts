export class AppError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

export function notFound(message = 'Not found') {
  return new AppError(message, 404);
}

export function badRequest(message: string) {
  return new AppError(message, 400);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError(message, 401);
}

export function forbidden(message = 'Forbidden') {
  return new AppError(message, 403);
}

export function tooManyRequests(message = 'Terlalu banyak percobaan. Coba lagi nanti.') {
  return new AppError(message, 429);
}

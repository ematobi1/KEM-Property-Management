import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.');
      fields[key] = issue.message;
    }
    res.status(422).json({
      error: { code: 'VALIDATION_FAILED', message: 'Request validation failed', fields },
    });
    return;
  }

  // Never leak internal error details in production
  const isDev = process.env['NODE_ENV'] === 'development';
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev && err instanceof Error ? err.message : 'An unexpected error occurred',
    },
  });
}

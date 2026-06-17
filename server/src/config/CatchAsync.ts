import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

/**
 * Wraps async Express route handlers to automatically pass errors to the next() middleware.
 */
export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Operational errors are predictable (e.g., invalid input, not found).
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}


import { ZodObject, ZodError } from 'zod';
import type { ZodTypeAny } from 'zod/v3';

export const validateRequest = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors
        .map(err => {
          const field = err.path.join(".") || "body";
          return `${field}: ${err.message}`;
        })
        .join(", ");

      return next(
        new AppError(`Validation failed: ${errors}`, 400)
      );
    }

    req.body = result.data;
    return next();
  };
};
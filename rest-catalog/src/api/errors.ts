/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "req|res|next" }] */

import type { Express, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '@lib/pino';
import createHttpError, { HttpError, isHttpError } from 'http-errors';
import * as jose from 'jose';

function getValidationErrorMessage(error: ZodError): string {
  return error.errors
    .map(zodError => `${zodError.code} for field '${zodError.path.join('.')}': ${zodError.message}`)
    .join(',');
}

function logError(error: unknown): void {
  // TODO: handle AxiosError
  if (error instanceof ZodError) {
    logger.warn(`Validation Error | message: ${getValidationErrorMessage(error)}`);
  } else if (isHttpError(error)) {
    logger.error(`Http error with status code ${error.statusCode} and message: ${error.message}`);
  } else if (error instanceof Error) {
    logger.error(`Error | message: ${error.message}`);
  } else {
    logger.error(`Unknown error | error:`, error);
  }
}

/*
 * Express only detects error middleware if it has 4 arguments
 * https://expressjs.com/en/guide/error-handling.html
 */
function errorHandler(
  error: unknown,
  req: Request<any, HttpError, any, any>,
  res: Response<HttpError>,
  next: NextFunction
) {
  logError(error);

  let code = 500; // default value
  let message = 'Internal Server Error'; // default value

  // TODO: handle AxiosError
  if (error instanceof ZodError) {
    code = 400;
    message = getValidationErrorMessage(error);
  } else if (isHttpError(error)) {
    code = error.statusCode;
    message = error.message;
  } else if (error instanceof jose.errors.JOSEError) {
    code = 400;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const errorResponse = createHttpError(code, message);
  return res.status(code).json(errorResponse);
}

function loadErrorHandlers(app: Express): void {
  app.use(errorHandler);
}

export { loadErrorHandlers };

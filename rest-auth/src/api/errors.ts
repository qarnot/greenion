/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "req|res|next" }] */

import type { Express, Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { ZodError } from 'zod';
import { logger } from '@lib/pino';
import createHttpError, { HttpError, isHttpError } from 'http-errors';

function getValidationErrorMessage(error: ZodError): string {
  return error.errors
    .map(zodError => `${zodError.code} for field '${zodError.path.join('.')}': ${zodError.message}`)
    .join(',');
}
function isOryError(
  error: any
): error is { response: { data: { error: { reason: string; message: string; code: number } } } } {
  return (
    error?.response?.data?.error?.code &&
    error?.response?.data?.error?.reason &&
    error?.response?.data?.error?.message
  );
}

function logError(error: unknown): void {
  // TODO: handle AxiosError
  if (error instanceof ZodError) {
    logger.warn(`Validation Error | message: ${getValidationErrorMessage(error)}`);
  } else if (error instanceof jose.errors.JOSEError) {
    logger.error(`Auth Error | message: ${error.message}`);
  } else if (isOryError(error)) {
    logger.error(`Ory Error | message: ${error.response.data.error.message}`);
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
  let reason;
  // TODO: handle AxiosError
  if (error instanceof ZodError) {
    code = 400;
    message = getValidationErrorMessage(error);
  } else if (error instanceof jose.errors.JOSEError) {
    code = 400;
    message = error.message;
  } else if (isHttpError(error)) {
    code = error.statusCode;
    message = error.message;
  } else if (isOryError(error)) {
    code = error.response.data.error.code;
    reason = error.response.data.error.reason;
    message = error.response.data.error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const properties: { reason?: string } = {};
  if (reason) properties.reason = reason;
  const errorResponse = createHttpError(code, message, { reason });

  return res.status(code).json(errorResponse);
}

function loadErrorHandlers(app: Express): void {
  app.use(errorHandler);
}

export { loadErrorHandlers };

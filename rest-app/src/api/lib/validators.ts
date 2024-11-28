import type { Request } from 'express';
import type { ZodRawShape, ZodObject, ZodType } from 'zod';

type Validator = {
  request: Schemas<ZodRawShape>;
  response: { [key: number]: ZodObject<ZodRawShape> };
};

type Schemas<T extends ZodRawShape> = {
  params?: ZodObject<T>;
  body?: ZodObject<T>;
  query?: ZodObject<T>;
};

type ParsedResult<T> = T extends ZodType<infer R> ? R : undefined;

function validator<U extends ZodRawShape, T extends Schemas<U>>(req: Request, schemas: T) {
  return {
    body: schemas.body?.parse(req.body) as ParsedResult<T['body']>,
    params: schemas.params?.parse(req.params) as ParsedResult<T['params']>,
    query: schemas.query?.parse(req.query) as ParsedResult<T['query']>,
  };
}

export type { Schemas, Validator };
export { validator };

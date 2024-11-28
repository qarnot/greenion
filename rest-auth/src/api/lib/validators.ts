import { Request } from 'express';
import { z } from './zod';

type Schemas<T extends z.ZodRawShape> = {
  params?: z.ZodObject<T>;
  body?: z.ZodObject<T>;
  query?: z.ZodObject<T>;
};

type ParsedResult<T> = T extends z.ZodType<infer R> ? R : undefined;

function validator<U extends z.ZodRawShape, T extends Schemas<U>>(req: Request, schemas: T) {
  return {
    body: schemas.body?.parse(req.body) as ParsedResult<T['body']>,
    params: schemas.params?.parse(req.params) as ParsedResult<T['params']>,
    query: schemas.query?.parse(req.query) as ParsedResult<T['query']>,
  };
}

export { Schemas, validator };

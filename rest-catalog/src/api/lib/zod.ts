import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

import { z } from 'zod';

extendZodWithOpenApi(z);

const zodSchemaId = z.coerce.number().int().positive();

function getIncludesQueryParamsSchema(nestedAssociations: string[]) {
  const zodLiterals = nestedAssociations.map(associationName => z.literal(associationName));
  // @ts-ignore - zod typing seems not happy with array of litterals and expected type for `union`
  const zodLiteralsUnion = z.union(zodLiterals).openapi({ example: nestedAssociations[0] });
  const zodIncludesArray = z
    .array(zodLiteralsUnion)
    .min(0)
    .max(nestedAssociations.length)
    .openapi({ example: nestedAssociations });
  const zodIncludesSingleElement = zodLiteralsUnion.transform(value => [value]);
  return z.object({ includes: z.union([zodIncludesArray, zodIncludesSingleElement]) }).partial();
}

export { z, zodSchemaId, getIncludesQueryParamsSchema };

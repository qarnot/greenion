import { Schemas } from '@api/lib/validators';
import { z } from '@api/lib/zod';

const schemas = {
  createUsers: {
    request: {
      body: z.object({
        password: z.string(),
        email: z.string().email(),
        role: z.enum(['user', 'admin']),
      }),
    },
    response: {
      200: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        metadata_public: z.object({
          role: z.enum(['user', 'admin']),
        }),
      }),
    },
  },
} satisfies {
  [routeKey: string]: {
    request: Schemas<z.ZodRawShape>;
    response: { [key: number]: z.ZodObject<z.ZodRawShape> };
  };
};

export { schemas };

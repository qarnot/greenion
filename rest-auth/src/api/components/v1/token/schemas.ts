import { Schemas } from '@api/lib/validators';
import { z } from '@api/lib/zod';

const schemas = {
  generateToken: {
    request: {
      body: z.object({
        audience: z.coerce
          .string()
          .openapi({ description: 'Id of machine intented to read this token' }),
        payload: z.object({
          sessionId: z.number(),
          machineExternalIp: z.string(),
          machineExternalPort: z.number(),
        }),
      }),
    },
    response: {
      200: z.object({
        jwt: z.string(),
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

import type { Validator } from '@api/lib/validators';
import { z } from '@api/lib/zod';

const tokenSchema = z.object({
  code: z.string(),
  scope: z.string(),
  state: z.string(),
});
const zodSchemaId = z.coerce.number().int().positive();

const userInfoOutputSchema = z.object({
  email: z.coerce.string().email(),
  role: z.enum(['user', 'admin']),
  id: zodSchemaId,
});

const schemas = {
  getUserInfo: {
    request: {},
    response: {
      200: userInfoOutputSchema,
    },
  },
  setSession: {
    request: {
      query: tokenSchema,
    },
    response: {},
  },
  initiateLogout: {
    request: {},
    response: { 302: z.object({ Location: z.string() }) },
  },
  logoutCallback: {
    request: {},
    response: { 302: z.object({ Location: z.string() }) },
  },
} satisfies Record<string, Validator>;

export { schemas };

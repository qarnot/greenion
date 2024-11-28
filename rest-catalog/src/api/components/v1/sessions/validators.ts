import type { Validator } from '@api/lib/validators';
import { z, getIncludesQueryParamsSchema, zodSchemaId } from '@api/lib/zod';

import { sessionIntputSchema, sessionOutputSchema } from './schemas';

const includesQueryParamsSchema = getIncludesQueryParamsSchema(['user', 'machine']);

const validators = {
  listSessions: {
    request: {
      query: sessionIntputSchema.merge(includesQueryParamsSchema).partial(),
    },
    response: {
      200: z.object({ sessions: z.array(sessionOutputSchema) }),
    },
  },
  createSession: {
    request: {
      query: includesQueryParamsSchema,
      body: sessionIntputSchema.omit({ closedAt: true }),
    },
    response: {
      200: sessionOutputSchema,
    },
  },
  getSessionById: {
    request: {
      query: includesQueryParamsSchema,
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      200: sessionOutputSchema,
      404: z.object({ message: z.string().openapi({ example: 'Session not found' }) }),
    },
  },
  updateSession: {
    request: {
      query: includesQueryParamsSchema,
      body: sessionIntputSchema.omit({ userId: true, machineId: true }), // can only update `closedAt`
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      200: sessionOutputSchema,
      404: z.object({ message: z.string().openapi({ example: 'Session not found' }) }),
    },
  },
  deleteSession: {
    request: {
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      404: z.object({ message: z.string().openapi({ example: 'Session not found' }) }),
    },
  },
} satisfies Record<string, Validator>;

export { validators };

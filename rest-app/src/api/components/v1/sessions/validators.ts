import type { Validator } from '@api/lib/validators';

import { sessionIntputSchema, sessionOutputSchema } from './schemas';

const validators = {
  createSession: {
    request: {
      body: sessionIntputSchema,
    },
    response: {
      200: sessionOutputSchema,
    },
  },
} satisfies Record<string, Validator>;

export { validators };

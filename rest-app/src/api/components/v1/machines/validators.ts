import type { Validator } from '@api/lib/validators';

import { machineInputSchema, machineAndCertificatesOutputSchema } from './schemas';

const validators = {
  createMachine: {
    request: {
      body: machineInputSchema,
    },
    response: {
      200: machineAndCertificatesOutputSchema,
    },
  },
} satisfies Record<string, Validator>;

export { validators };

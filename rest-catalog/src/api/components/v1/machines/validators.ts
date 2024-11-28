import type { Validator } from '@api/lib/validators';
import { z, getIncludesQueryParamsSchema, zodSchemaId } from '@api/lib/zod';
import { userOutputSchema } from '@api/components/v1/users/schemas';

import { machineOutputSchema, machineInputSchema } from './schemas';

// same value as NestedAssociations
const includesQueryParamsSchema = getIncludesQueryParamsSchema(['user']);

const validators = {
  listMachines: {
    request: {
      query: machineInputSchema.merge(includesQueryParamsSchema).partial(),
    },
    response: {
      200: z.object({ machines: z.array(machineOutputSchema) }),
    },
  },
  createMachine: {
    request: {
      query: includesQueryParamsSchema,
      body: machineInputSchema,
    },
    response: {
      200: machineOutputSchema,
    },
  },
  getMachineById: {
    request: {
      query: includesQueryParamsSchema,
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      200: machineOutputSchema,
      404: z.object({ message: z.string().openapi({ example: 'Machine not found' }) }),
    },
  },
  updateMachineById: {
    request: {
      query: includesQueryParamsSchema,
      body: machineInputSchema.partial(),
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      200: machineOutputSchema,
      404: z.object({ message: z.string().openapi({ example: 'Machine not found' }) }),
    },
  },
  deleteMachine: {
    request: {
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      404: z.object({ message: z.string().openapi({ example: 'Machine not found' }) }),
    },
  },
  getUsersOfMachine: {
    request: {
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      200: z.object({
        users: z.array(userOutputSchema),
      }),
      404: z.object({ message: z.string().openapi({ example: 'Machine not found' }) }),
    },
  },
} satisfies Record<string, Validator>;

export { validators };

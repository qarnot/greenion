import type { Validator } from '@api/lib/validators';
import { z, getIncludesQueryParamsSchema, zodSchemaId } from '@api/lib/zod';
import { machineOutputSchema } from '@api/components/v1/machines/schemas';

import { userOutputSchema, userInputSchema } from './schemas';

// same value as NestedAssociations
const includesQueryParamsSchema = getIncludesQueryParamsSchema(['machine']);

const validators = {
  listUsers: {
    request: {
      query: userInputSchema.merge(includesQueryParamsSchema).partial(),
    },
    response: {
      200: z.object({ users: z.array(userOutputSchema) }),
    },
  },
  createUser: {
    request: {
      query: includesQueryParamsSchema,
      body: userInputSchema,
    },
    response: {
      200: userOutputSchema,
    },
  },
  getUserById: {
    request: {
      query: includesQueryParamsSchema,
      params: z.object({ userId: zodSchemaId }),
    },
    response: {
      200: userOutputSchema,
      404: z.object({ message: z.string().openapi({ example: 'User not found' }) }),
    },
  },
  updateUserById: {
    request: {
      query: includesQueryParamsSchema,
      body: userInputSchema.omit({ uuid: true }),
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      200: userOutputSchema,
      404: z.object({ message: z.string().openapi({ example: 'User not found' }) }),
    },
  },
  deleteUser: {
    request: {
      params: z.object({ id: zodSchemaId }),
    },
    response: {
      404: z.object({ message: z.string().openapi({ example: 'User not found' }) }),
    },
  },
  getMachinesOfUser: {
    request: {
      query: getIncludesQueryParamsSchema(['session']),
      params: z.object({ userId: zodSchemaId }),
    },
    response: {
      200: z.object({
        machines: z.array(machineOutputSchema),
      }),
      404: z.object({ message: z.string().openapi({ example: 'User not found' }) }),
    },
  },
  linkMachineToUser: {
    request: {
      params: z.object({
        userId: zodSchemaId,
        machineId: zodSchemaId,
      }),
    },
    response: {
      404: z.object({ message: z.string().openapi({ example: 'User or machine not found' }) }),
    },
  },
  unlinkMachineFromUser: {
    request: {
      params: z.object({
        userId: zodSchemaId,
        machineId: zodSchemaId,
      }),
    },
    response: {
      404: z.object({ message: z.string().openapi({ example: 'User or machine not found' }) }),
    },
  },
} satisfies Record<string, Validator>;

export { validators };

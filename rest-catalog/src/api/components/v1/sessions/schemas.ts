// NOTE: define and export zod validation scheam for machine in a separated file to avoid import loops
import { z, zodSchemaId } from '@api/lib/zod';

import { userOutputSchema } from '../users/schemas';
import { machineOutputSchema } from '../machines/schemas';

// coherent with defaullScope in model
const sessionOutputSchema = z.object({
  id: zodSchemaId,
  closedAt: z.union([z.coerce.date().openapi({ example: '2024-08-29T10:49:09.000Z' }), z.null()]),
  user: userOutputSchema,
  machine: machineOutputSchema,
  createdAt: z.date(),
});

// in DB we are storing userMachineId for association with users_machines model,
// however for user this will remain "transparent" as he only is manipulating user & machine IDs
const sessionIntputSchema = sessionOutputSchema
  .omit({
    id: true,
    user: true,
    machine: true,
    createdAt: true,
  })
  .merge(
    z.object({
      userId: zodSchemaId,
      machineId: zodSchemaId,
    })
  );

export { sessionOutputSchema, sessionIntputSchema };

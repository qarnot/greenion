// NOTE: define and export zod validation scheam for machine in a separated file to avoid import loops
import { z, zodSchemaId } from '@api/lib/zod';

// coherent with defaullScope in model
const userOutputSchema = z.object({
  id: zodSchemaId,
  uuid: z.coerce.string().uuid(),
  createdAt: z.date(),
});

const userInputSchema = userOutputSchema.omit({ id: true, createdAt: true });

export { userOutputSchema, userInputSchema };

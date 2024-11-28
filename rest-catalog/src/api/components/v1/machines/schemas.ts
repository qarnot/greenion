// NOTE: define and export zod validation scheam for machine in a separated file to avoid import loops
import { z, zodSchemaId } from '@api/lib/zod';

// same attributes as model
const machineOutputSchema = z.object({
  id: zodSchemaId,
  name: z.coerce.string().openapi({ example: 'My Machine' }),
  ip: z.coerce.string().ip().openapi({ example: '127.0.0.1' }),
  port: z.coerce.number().int().positive().openapi({ example: 5055 }),
  externalIp: z.coerce.string().ip().openapi({ example: '127.0.0.1' }),
  externalPort: z.coerce.number().int().positive().openapi({ example: 5033 }),
  createdAt: z.date(),
});

const machineInputSchema = machineOutputSchema.omit({ id: true, createdAt: true });

export { machineOutputSchema, machineInputSchema };

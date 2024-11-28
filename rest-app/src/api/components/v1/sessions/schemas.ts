import { z } from '@api/lib/zod';

const zodSchemaId = z.coerce.number().int().positive();

const userOutputSchema = z.object({
  id: zodSchemaId,
  uuid: z.coerce.string().uuid(),
  createdAt: z.date(),
});

const machineOutputSchema = z.object({
  id: zodSchemaId,
  ip: z.coerce.string().ip().openapi({ example: '127.0.0.1' }),
  port: z.coerce.number().int().positive().openapi({ example: 5055 }),
  externalIp: z.coerce.string().ip().openapi({ example: '127.0.0.1' }),
  externalPort: z.coerce.number().int().positive().openapi({ example: 5033 }),
  createdAt: z.date(),
});

const sessionOutputSchema = z.object({
  session: z.object({
    id: zodSchemaId,
    closedAt: z.union([z.coerce.date().openapi({ example: '2024-08-29T10:49:09.000Z' }), z.null()]),
    createdAt: z.date(),
    userMachine: z.object({
      user: userOutputSchema,
      machine: machineOutputSchema,
    }),
  }),
  jwt: z.string(),
});

const sessionIntputSchema = z.object({
  machineId: zodSchemaId,
});

export { sessionOutputSchema, sessionIntputSchema };

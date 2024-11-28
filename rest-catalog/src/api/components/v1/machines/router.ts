import express, { NextFunction, Request, Response } from 'express';
import { registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import {
  create,
  destroy,
  getById,
  list,
  update,
  getUsersById as getUsersOfMachineById,
} from '@api/components/v1/machines/service';
import { Machine } from '@api/components/v1/machines/model';
import { validators } from './validators';
import { User } from '../users/model';

const router = express.Router();

const BASE_ROUTE = 'machines';
const OPEN_API_TAGS = ['machines'];
const OPEN_API_SECURITY = [{ bearerAuth: [] }];

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'get',
  path: `/api/v1/${BASE_ROUTE}`,
  description: 'List all machines',
  request: formatDoc.request(validators.listMachines.request),
  responses: {
    200: {
      description: 'Array of machines',
      content: {
        'application/json': { schema: validators.listMachines.response[200] },
      },
    },
  },
});
router.get(`/`, async (req: Request, res: Response<Machine.Instance[]>, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const {
      query: { includes, ...searchParams },
    } = validator(req, validators.listMachines.request);
    const machines = await list(searchParams, { includes, transaction });
    await transaction.commit();
    return res.status(200).json(machines);
  } catch (error) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'post',
  path: `/api/v1/${BASE_ROUTE}`,
  description: 'Create a new machine',
  request: formatDoc.request(validators.createMachine.request),
  responses: {
    200: {
      description: 'Return machine created',
      content: {
        'application/json': { schema: validators.createMachine.response[200] },
      },
    },
  },
});
router.post(`/`, async (req: Request, res: Response<Machine.Instance>, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const {
      body,
      query: { includes },
    } = validator(req, validators.createMachine.request);
    const machine = await create(body, { includes, transaction });
    await transaction.commit();
    return res.status(201).json(machine);
  } catch (error: any) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'get',
  path: `/api/v1/${BASE_ROUTE}/{id}`,
  description: 'Get machine by ID',
  request: formatDoc.request(validators.getMachineById.request),
  responses: {
    200: {
      description: 'Get machine by id',
      content: {
        'application/json': { schema: validators.getMachineById.response[200] },
      },
    },
    404: {
      description: 'Machine not found',
      content: {
        'application/json': { schema: validators.getMachineById.response[404] },
      },
    },
  },
});
router.get(`/:id`, async (req: Request, res: Response, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const {
      params,
      query: { includes },
    } = validator(req, validators.getMachineById.request);
    const machine = await getById(params.id, { includes, transaction });
    await transaction.commit();
    return res.status(200).json(machine);
  } catch (error) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'put',
  path: `/api/v1/${BASE_ROUTE}/{id}`,
  description: 'Update machine by ID',
  request: formatDoc.request(validators.updateMachineById.request),
  responses: {
    200: {
      description: 'Machine updated',
      content: {
        'application/json': { schema: validators.updateMachineById.response[200] },
      },
    },
    404: {
      description: 'Machine not found',
      content: {
        'application/json': { schema: validators.updateMachineById.response[404] },
      },
    },
  },
});
router.put(`/:id`, async (req: Request, res: Response, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const {
      params,
      body,
      query: { includes },
    } = validator(req, validators.updateMachineById.request);
    const machine = await update(params.id, body, { includes, transaction });
    await transaction.commit();
    return res.status(200).json(machine);
  } catch (error) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'delete',
  path: `/api/v1/${BASE_ROUTE}/{id}`,
  description: 'Delete machine by ID',
  request: formatDoc.request(validators.deleteMachine.request),
  responses: {
    204: { description: 'Machine deleted' },
    404: {
      description: 'Machine not found',
      content: {
        'application/json': { schema: validators.deleteMachine.response[404] },
      },
    },
  },
});

router.delete(`/:id`, async (req: Request, res: Response, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const { params } = validator(req, validators.deleteMachine.request);
    await destroy(params.id, { transaction });
    await transaction.commit();
    return res.sendStatus(204);
  } catch (error) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'get',
  path: `/api/v1/${BASE_ROUTE}/{id}/users`,
  description: `Get machine's users. Same behaviour as 'GET /api/v1/${BASE_ROUTE}/{id}?includes[]=user'.`,
  request: formatDoc.request(validators.getUsersOfMachine.request),
  responses: {
    200: {
      description: 'Returns users linked to machine',
      content: {
        'application/json': { schema: validators.getUsersOfMachine.response[200] },
      },
    },
    404: {
      description: 'Machine not found',
      content: {
        'application/json': { schema: validators.getUsersOfMachine.response[404] },
      },
    },
  },
});
router.get(
  `/:id/users`,
  async (req: Request, res: Response<{ users: User.Instance[] }>, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const { params } = validator(req, validators.getUsersOfMachine.request);
      const users = await getUsersOfMachineById(params.id, { transaction });
      await transaction.commit();
      return res.status(200).send({ users });
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

export default router;

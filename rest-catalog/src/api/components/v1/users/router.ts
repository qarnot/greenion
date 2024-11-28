import express, { NextFunction, Request, Response } from 'express';
import { registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import {
  list,
  getById,
  create,
  update,
  destroy,
  getMachinesById as getMachinesOfUserById,
  linkMachineById as linkMachineToUserById,
  unlinkMachineById as unlinkMachineFromUserById,
} from '@api/components/v1/users/service';
import { User } from '@api/components/v1/users/model';
import {
  isAdmin,
  isAdminOrSelfUserIdInParams,
  isAdminOrSelfUserUuidInQuery,
} from '@api/middlewares/security';
import { validators } from './validators';

const router = express.Router();

const BASE_ROUTE = 'users';
const OPEN_API_TAGS = ['users'];
const OPEN_API_SECURITY = [{ bearerAuth: [] }];

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'get',
  path: `/api/v1/${BASE_ROUTE}`,
  description: 'List all users',
  request: formatDoc.request(validators.listUsers.request),
  responses: {
    200: {
      description: 'Array of users',
      content: {
        'application/json': { schema: validators.listUsers.response[200] },
      },
    },
  },
});
router.get(
  `/`,
  isAdminOrSelfUserUuidInQuery,
  async (req: Request, res: Response<User.Instance[]>, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const {
        query: { includes, ...searchParams },
      } = validator(req, validators.listUsers.request);
      const users = await list(searchParams, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(users);
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'post',
  path: `/api/v1/${BASE_ROUTE}`,
  description: 'Create a new user',
  request: formatDoc.request(validators.createUser.request),
  responses: {
    200: {
      description: 'Return user created',
      content: {
        'application/json': { schema: validators.createUser.response[200] },
      },
    },
  },
});
router.post(
  `/`,
  isAdmin,
  async (req: Request, res: Response<User.Instance>, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const {
        body,
        query: { includes },
      } = validator(req, validators.createUser.request);
      const user = await create(body, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(user);
    } catch (error: any) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'get',
  path: `/api/v1/${BASE_ROUTE}/{userId}`,
  description: 'Get machine by ID',
  request: formatDoc.request(validators.getUserById.request),
  responses: {
    200: {
      description: 'Get user by id',
      content: {
        'application/json': { schema: validators.getUserById.response[200] },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': { schema: validators.getUserById.response[404] },
      },
    },
  },
});
router.get(
  `/:userId`,
  isAdminOrSelfUserIdInParams,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const {
        params,
        query: { includes },
      } = validator(req, validators.getUserById.request);
      const user = await getById(params.userId, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(user);
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'put',
  path: `/api/v1/${BASE_ROUTE}/{id}`,
  description: 'Update user by ID',
  request: formatDoc.request(validators.updateUserById.request),
  responses: {
    200: {
      description: 'User updated',
      content: {
        'application/json': { schema: validators.updateUserById.response[200] },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': { schema: validators.updateUserById.response[404] },
      },
    },
  },
});
router.put(`/:id`, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const {
      params,
      body,
      query: { includes },
    } = validator(req, validators.updateUserById.request);
    const user = await update(params.id, body, { includes, transaction });
    await transaction.commit();
    return res.status(200).json(user);
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
  request: formatDoc.request(validators.deleteUser.request),
  responses: {
    204: { description: 'User deleted' },
    404: {
      description: 'User not found',
      content: {
        'application/json': { schema: validators.deleteUser.response[404] },
      },
    },
  },
});
router.delete(`/:id`, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  let transaction;
  try {
    transaction = await req.getTransaction();
    const { params } = validator(req, validators.deleteUser.request);
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
  path: `/api/v1/${BASE_ROUTE}/{userId}/machines`,
  description: "Get user's machines",
  request: formatDoc.request(validators.getMachinesOfUser.request),
  responses: {
    200: {
      description: 'Returns machines linked to users',
      content: {
        'application/json': { schema: validators.getMachinesOfUser.response[200] },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': { schema: validators.getMachinesOfUser.response[404] },
      },
    },
  },
});
router.get(
  `/:userId/machines`,
  isAdminOrSelfUserIdInParams,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const {
        params,
        query: { includes },
      } = validator(req, validators.getMachinesOfUser.request);
      const machines = await getMachinesOfUserById(params.userId, { includes, transaction });
      await transaction.commit();
      return res.status(200).send({ machines });
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'post',
  path: `/api/v1/${BASE_ROUTE}/{userId}/machines/{machineId}`,
  description: 'Link user to machine',
  request: formatDoc.request(validators.linkMachineToUser.request),
  responses: {
    204: { description: 'Successful linking' },
    404: {
      description: 'User or machine not found',
      content: {
        'application/json': { schema: validators.linkMachineToUser.response[404] },
      },
    },
  },
});
router.post(
  `/:userId/machines/:machineId`,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const { params } = validator(req, validators.linkMachineToUser.request);
      await linkMachineToUserById(params.userId, params.machineId, { transaction });
      await transaction.commit();
      return res.sendStatus(204);
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'delete',
  path: `/api/v1/${BASE_ROUTE}/{userId}/machines/{machineId}`,
  description: 'Delete user machine',
  request: formatDoc.request(validators.unlinkMachineFromUser.request),
  responses: {
    204: { description: 'Successful unlinking' },
    404: {
      description: 'User or machine not found',
      content: {
        'application/json': { schema: validators.unlinkMachineFromUser.response[404] },
      },
    },
  },
});
router.delete(
  `/:userId/machines/:machineId`,
  isAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const { params } = validator(req, validators.unlinkMachineFromUser.request);
      await unlinkMachineFromUserById(params.userId, params.machineId, { transaction });
      await transaction.commit();
      return res.sendStatus(204);
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

export default router;

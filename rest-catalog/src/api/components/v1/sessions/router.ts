import express, { NextFunction, Request, Response } from 'express';
import { registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { create, destroy, update, list, getById } from '@api/components/v1/sessions/service';
import { Session } from '@api/components/v1/sessions/model';
import {
  isAdminOrSelfUserIdInBody,
  isAdminOrSelfUserIdInQuery,
  isAdminOrUserOwnsSession,
} from '@api/middlewares/security';
import { validators } from './validators';

const router = express.Router();

const BASE_ROUTE = 'sessions';
const OPEN_API_TAGS = ['sessions'];
const OPEN_API_SECURITY = [{ bearerAuth: [] }];

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'get',
  path: `/api/v1/${BASE_ROUTE}`,
  description: 'List all sessions',
  request: formatDoc.request(validators.listSessions.request),
  responses: {
    200: {
      description: 'Array of sessions',
      content: {
        'application/json': { schema: validators.listSessions.response[200] },
      },
    },
  },
});
router.get(
  `/`,
  isAdminOrSelfUserIdInQuery,
  async (req: Request, res: Response<Session.Instance[]>, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const {
        query: { includes, ...searchParams },
      } = validator(req, validators.listSessions.request);
      const sessions = await list(searchParams, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(sessions);
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
  description: 'Create a new session',
  request: formatDoc.request(validators.createSession.request),
  responses: {
    200: {
      description: 'Return new session',
      content: {
        'application/json': { schema: validators.createSession.response[200] },
      },
    },
  },
});
router.post(
  `/`,
  isAdminOrSelfUserIdInBody,
  async (req: Request, res: Response<Session.Instance>, next: NextFunction) => {
    let transaction;
    try {
      const {
        body,
        query: { includes },
      } = validator(req, validators.createSession.request);
      transaction = await req.getTransaction();
      const session = await create(body.userId, body.machineId, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(session);
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
  path: `/api/v1/${BASE_ROUTE}/{id}`,
  description: 'Get session by ID',
  request: formatDoc.request(validators.getSessionById.request),
  responses: {
    200: {
      description: 'Get session by id',
      content: {
        'application/json': { schema: validators.getSessionById.response[200] },
      },
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': { schema: validators.getSessionById.response[404] },
      },
    },
  },
});
router.get(
  `/:id`,
  isAdminOrUserOwnsSession,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      const {
        params,
        query: { includes },
      } = validator(req, validators.getSessionById.request);
      transaction = await req.getTransaction();
      const session = await getById(params.id, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(session);
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
  description: 'Update session by ID',
  request: formatDoc.request(validators.updateSession.request),
  responses: {
    200: {
      description: 'Session updated',
      content: {
        'application/json': { schema: validators.updateSession.response[200] },
      },
    },
    404: {
      description: 'Session not found',
      content: {
        'application/json': { schema: validators.updateSession.response[404] },
      },
    },
  },
});
router.put(
  `/:id`,
  isAdminOrUserOwnsSession,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const {
        params,
        body,
        query: { includes },
      } = validator(req, validators.updateSession.request);
      const session = await update(params.id, body, { includes, transaction });
      await transaction.commit();
      return res.status(200).json(session);
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
  path: `/api/v1/${BASE_ROUTE}/{id}`,
  description: 'Delete session by ID',
  request: formatDoc.request(validators.deleteSession.request),
  responses: {
    204: { description: 'Session deleted' },
    404: {
      description: 'Session not found',
      content: {
        'application/json': { schema: validators.deleteSession.response[404] },
      },
    },
  },
});

router.delete(
  `/:id`,
  isAdminOrUserOwnsSession,
  async (req: Request, res: Response, next: NextFunction) => {
    let transaction;
    try {
      transaction = await req.getTransaction();
      const { params } = validator(req, validators.deleteSession.request);
      await destroy(params.id, { transaction });
      await transaction.commit();
      return res.sendStatus(204);
    } catch (error) {
      if (transaction) await transaction.safeRollback();
      return next(error);
    }
  }
);

export default router;

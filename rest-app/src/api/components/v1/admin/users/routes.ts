import express, { NextFunction, Request, Response } from 'express';
import { registry, formatDoc, bearerAuth } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { isAdmin } from '@api/middlewares';
import * as config from '@config';
import { IdentityCreateOutput } from 'types/iam';
import { createUser } from './services';
import { schemas } from './schemas';

const OPEN_API_TAGS = ['admin'];
const router = express.Router();

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [bearerAuth.name]: [] }],
  method: 'post',
  path: `/api/v1/admin/users`,
  description: `Create new user`,
  request: formatDoc.request(schemas.createUsers.request),
  responses: {
    200: {
      description: 'Return created user',
      content: {
        'application/json': { schema: schemas.createUsers.response[200] },
      },
    },
  },
});
router.post(
  '/admin/users',
  isAdmin,
  async (req: Request, res: Response<IdentityCreateOutput>, next: NextFunction) => {
    try {
      const { body } = validator(req, schemas.createUsers.request);
      const user = await createUser(body, {
        accessToken: req.cookies[config.authorization.cookie.name],
      });
      return res.send(user);
    } catch (error: any) {
      return next(error);
    }
  }
);

export default router;

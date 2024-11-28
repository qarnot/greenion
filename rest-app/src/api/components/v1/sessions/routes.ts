import express, { NextFunction, Request, Response } from 'express';

import { registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { create } from '@api/components/v1/sessions/service';
import * as config from '@config';

import { validators } from './validators';

const router = express.Router();

const OPEN_API_TAGS = ['sessions'];
const OPEN_API_SECURITY = [{ bearerAuth: [] }];

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'post',
  path: `/api/v1/sessions`,
  description: 'Create a new VDI session for authenticated user on machine specified in request',
  request: formatDoc.request(validators.createSession.request),
  responses: {
    200: {
      description: 'Return new VDI session',
      content: {
        'application/json': { schema: validators.createSession.response[200] },
      },
    },
  },
});
router.post(`/sessions`, async (req: Request, res: Response<any>, next: NextFunction) => {
  try {
    const { body } = validator(req, validators.createSession.request);
    const accessToken = req.cookies[config.authorization.cookie.name];
    const { session, jwt } = await create(req.session.subject, body.machineId, { accessToken });
    return res.status(200).json({ session, jwt });
  } catch (error: any) {
    return next(error);
  }
});

export default router;

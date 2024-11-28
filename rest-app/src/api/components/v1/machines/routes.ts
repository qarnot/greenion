import express, { NextFunction, Request, Response } from 'express';

import { registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { create } from '@api/components/v1/machines/service';
import * as config from '@config';
import { isAdmin } from '@api/middlewares';

import { Machine } from 'types/catalog';
import { validators } from './validators';

const router = express.Router();

const OPEN_API_TAGS = ['machines'];
const OPEN_API_SECURITY = [{ bearerAuth: [] }];

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: OPEN_API_SECURITY,
  method: 'post',
  path: `/api/v1/machines`,
  description: 'Add new machine in catalog and generate private key and certificate',
  request: formatDoc.request(validators.createMachine.request),
  responses: {
    200: {
      description: 'Return private key and certificate of new machine',
      content: {
        'application/json': { schema: validators.createMachine.response[200] },
      },
    },
  },
});
router.post(
  `/machines`,
  isAdmin,
  async (
    req: Request,
    res: Response<{ machine: Machine; signedCertificate: string; privateKey: string }>,
    next: NextFunction
  ) => {
    try {
      const { body } = validator(req, validators.createMachine.request);
      const accessToken = req.cookies[config.authorization.cookie.name];
      const { machine, signedCertificate, privateKey } = await create(body, { accessToken });
      return res.status(200).json({ machine, signedCertificate, privateKey });
    } catch (error: any) {
      return next(error);
    }
  }
);

export default router;

import express, { NextFunction, Request, Response } from 'express';
import { registry, formatDoc, bearerAuth } from '@api/lib/openapi';
import { hydra } from '@config';
import { validator } from '@api/lib/validators';
import { generateToken } from '@services/jwt';
import { schemas } from './schemas';

const OPEN_API_TAGS = ['token'];
const router = express.Router();

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [bearerAuth.name]: [] }],
  method: 'post',
  path: `/api/v1/token`,
  description: `Generate JWT to later use as vdi session, Subject will be bearer of the access token and will be sign with the ${hydra.jwks.accessToken.name} json web key set`,
  request: formatDoc.request(schemas.generateToken.request),
  responses: {
    200: {
      description: 'Return session token as jwt',
      content: {
        'application/json': { schema: schemas.generateToken.response[200] },
      },
    },
  },
});
router.post('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = validator(req, schemas.generateToken.request);
    const jwt = await generateToken(req.session.subject, body.audience, body.payload);

    return res.send({ jwt });
  } catch (error: any) {
    return next(error);
  }
});

export default router;

import express, { NextFunction, Request, Response } from 'express';
import { registry, formatDoc, bearerAuth } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { isAdmin } from '@api/middlewares';
import { generateSignedCertificateAndSecretKey } from './services';
import { schemas } from './schemas';

const OPEN_API_TAGS = ['certificates'];
const router = express.Router();

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [bearerAuth.name]: [] }],
  method: 'post',
  path: `/api/v1/certificates`,
  description: `Create secret key and signed certificate for given machiine (using its id)`,
  request: formatDoc.request(schemas.generateSignedCertificate.request),
  responses: {
    200: {
      description: 'Return secret key and signed certificate as PEM format',
      content: {
        'application/json': { schema: schemas.generateSignedCertificate.response[200] },
      },
    },
  },
});
router.post('/certificates', isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = validator(req, schemas.generateSignedCertificate.request);
    const result = generateSignedCertificateAndSecretKey(body);
    return res.send(result);
  } catch (error: any) {
    return next(error);
  }
});

export default router;

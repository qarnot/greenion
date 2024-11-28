import { logger } from '@lib/pino';
import { getPublicKey, verify, getHeader } from '@services/jwt';
import * as config from '@config';
import httpErrors from 'http-errors';
import { getAuthUrl } from '@services/iam';
import { Request, NextFunction, Response } from 'express';

const log = logger._.SECURITY;

async function checkSessionCookie(req: Request, res: Response<any>, next: NextFunction) {
  try {
    const session = req.cookies[config.authorization.cookie.name];
    if (session) {
      const headers = getHeader(session);
      if (!headers.kid) throw httpErrors.InternalServerError('Missing kid value from jwt header');
      const publicKey = await getPublicKey(headers.kid);
      const { payload } = await verify(session, publicKey);
      if (!payload.sub) throw httpErrors.InternalServerError('Missing subject from jwt payload');
      req.session = {
        subject: payload.sub,
        isAdmin: (payload.scp as string[]).includes('admin'),
      };
      return next();
    }
  } catch (error) {
    log.error(error);
  }

  try {
    const url = await getAuthUrl(res);
    return res.status(400).send({ redirect_to: url });
  } catch (error) {
    return next(error);
  }
}

async function isAdmin(req: Request, res: Response<any>, next: NextFunction) {
  try {
    if (!req?.session?.isAdmin) throw httpErrors.Forbidden('Forbidden');
    return next();
  } catch (error) {
    return next(error);
  }
}

export { checkSessionCookie, isAdmin };

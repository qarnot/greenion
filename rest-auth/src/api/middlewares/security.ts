import type { Request, Response, NextFunction } from 'express';
import httpErrors from 'http-errors';
import { getPublicKey, verify, getHeader } from '@services/jwt';

async function checkAccessToken(req: Request, res: Response<any>, next: NextFunction) {
  try {
    if (!req.headers.authorization) {
      throw httpErrors.Unauthorized('You must provide a token in the authorization header');
    }

    const token = req.headers.authorization;
    // handle both "Classic" and "Bearer" auth schemes
    // even if "Bearer" should be privileged for Oauth2 protected resources
    // for more details see https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
    const bearerTokenMatch = token.match(/^Bearer (.+)$/);
    const actualToken = bearerTokenMatch?.[1] ?? token;

    const headers = getHeader(actualToken);
    if (!headers.kid) throw httpErrors.InternalServerError('Missing kid value from jwt header');
    const publicKey = await getPublicKey(headers.kid);
    const { payload } = await verify(actualToken, publicKey);
    if (!payload.sub) throw httpErrors.InternalServerError('Missing subject from jwt payload');
    req.session = {
      subject: payload.sub,
      isAdmin: (payload.scp as string[]).includes('admin'),
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function isAdmin(req: Request, res: Response<any>, next: NextFunction) {
  try {
    if (!req.session.isAdmin) throw httpErrors.Forbidden('Forbidden');
    return next();
  } catch (error) {
    return next(error);
  }
}

export { checkAccessToken, isAdmin };

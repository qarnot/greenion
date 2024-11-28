import { Request, Response, NextFunction } from 'express';
import * as config from '@config';
import httpErrors from 'http-errors';
import { logger } from '@lib/pino';
import { getPublicKey, verify, getHeader, verifyVdiJWT } from '@services/jwt';
import { getById } from '@api/components/v1/users/service';
import { getById as getSessionById } from '@api/components/v1/sessions/service';
import { Session, UsersMachinesAssociation, User } from '@db/data';

async function checkAccessTokenInternal(
  req: Request,
  res: Response<any>,
  next: NextFunction,
  options = { allowVdiJWT: false }
) {
  try {
    let token = req.headers.authorization;
    if (!token) {
      token = req.cookies[config.authorization.cookie.name];
      if (!token) {
        throw httpErrors.Unauthorized(
          'You must provide a token in the authorization header or as cookie'
        );
      }
    }

    // handle both "Classic" and "Bearer" auth schemes
    // even if "Bearer" should be privileged for Oauth2 protected resources
    // for more details see https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication
    const bearerTokenMatch = token.match(/^Bearer (.+)$/);
    const actualToken = bearerTokenMatch?.[1] ?? token;

    const headers = getHeader(actualToken);
    if (!headers.kid) throw httpErrors.InternalServerError('Missing kid value from jwt header');
    const publicKey = await getPublicKey(headers.kid);
    let verifiedToken;
    if (options.allowVdiJWT && headers.kid === config.hydra.jwks.sessionVDI.kid) {
      verifiedToken = await verifyVdiJWT(actualToken, publicKey);
    } else {
      verifiedToken = await verify(actualToken, publicKey);
    }
    const { payload } = verifiedToken;
    if (!payload.sub) throw httpErrors.InternalServerError('Missing subject from jwt payload');
    req.session = {
      subject: payload.sub,
      isAdmin: (payload.scp as string[])?.includes('admin'),
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function checkAccessToken(req: Request, res: Response<any>, next: NextFunction) {
  return checkAccessTokenInternal(req, res, next, { allowVdiJWT: false });
}

async function checkAccessTokenOrVdi(req: Request, res: Response<any>, next: NextFunction) {
  return checkAccessTokenInternal(req, res, next, { allowVdiJWT: true });
}

async function isAdmin(req: Request, res: Response<any>, next: NextFunction) {
  try {
    if (!req.session.isAdmin) throw httpErrors.Forbidden('Forbidden');
    return next();
  } catch (error) {
    return next(error);
  }
}
async function isAdminOrUserOwnsSession(req: Request, res: Response<any>, next: NextFunction) {
  let transaction;
  try {
    if (req.session.isAdmin) return next();
    transaction = await req.getTransaction();
    const session: Session.Instance & {
      userMachine?: UsersMachinesAssociation.Instance & { user?: User.Instance };
    } = await getSessionById(Number(req.params.id), { transaction, paranoid: false });
    if (session?.userMachine?.user?.uuid === req.session.subject) return next();
    await transaction.commit();
    throw httpErrors.Forbidden('Forbidden');
  } catch (error: any) {
    if (transaction) await transaction.safeRollback();
    if (error?.status === 404) {
      return next(httpErrors.Forbidden('Forbidden'));
    }
    return next(error);
  }
}

async function isAdminOrSelfUserId(
  req: Request,
  res: Response<any>,
  next: NextFunction,
  userId: number
) {
  let transaction;
  try {
    if (req.session.isAdmin) return next();
    transaction = await req.getTransaction();
    if (!userId) {
      logger.error('User id could not be retrieved. Please check security middlewares.');
      throw httpErrors.InternalServerError('Missing data to authenticate user');
    }
    const user = await getById(Number(userId), { transaction });
    if (user.uuid === req.session.subject) return next();
    await transaction.commit();
    throw httpErrors.Forbidden('Forbidden');
  } catch (error) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
}

async function isAdminOrSelfUserUuidInQuery(req: Request, res: Response<any>, next: NextFunction) {
  let transaction;
  try {
    if (req.session.isAdmin) return next();
    transaction = await req.getTransaction();
    const { uuid } = req.query;
    if (uuid === req.session.subject) return next();
    await transaction.commit();
    throw httpErrors.Forbidden('Forbidden');
  } catch (error) {
    if (transaction) await transaction.safeRollback();
    return next(error);
  }
}

async function isAdminOrSelfUserIdInBody(req: Request, res: Response<any>, next: NextFunction) {
  return isAdminOrSelfUserId(req, res, next, req.body.userId);
}
async function isAdminOrSelfUserIdInParams(req: Request, res: Response<any>, next: NextFunction) {
  return isAdminOrSelfUserId(req, res, next, Number(req.params.userId));
}
async function isAdminOrSelfUserIdInQuery(req: Request, res: Response<any>, next: NextFunction) {
  return isAdminOrSelfUserId(req, res, next, Number(req.query.userId));
}

export {
  checkAccessToken,
  checkAccessTokenOrVdi,
  isAdmin,
  isAdminOrSelfUserUuidInQuery,
  isAdminOrSelfUserIdInBody,
  isAdminOrSelfUserIdInParams,
  isAdminOrSelfUserIdInQuery,
  isAdminOrUserOwnsSession,
};

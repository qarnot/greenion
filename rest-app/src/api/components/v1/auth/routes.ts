import express, { NextFunction, Request, Response } from 'express';

import { authorizationCodeFlowAuth, registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { checkSessionCookie } from '@api/middlewares';
import { hydra, authorization } from '@config';
import * as config from '@config';
import { getAuthUrl } from '@services/iam';
import { getOauth2Client } from '@services/ory';

import { schemas } from './schemas';
import { getUserInfo } from './services';

const router = express.Router();

const OPEN_API_TAGS = ['auth'];

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [authorizationCodeFlowAuth.name]: [] }],
  method: 'get',
  path: `/api/v1/auth/token`,
  description: `Exchange code with access token and set session cookie \`${authorization.cookie.name}\``,
  request: formatDoc.request(schemas.setSession.request),
  responses: formatDoc.response(200, 'OK'),
});
router.get('/auth/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    validator(req, schemas.setSession.request);
    const client = await getOauth2Client();
    const params = client.callbackParams(req);
    const tokenset = await client.callback(hydra.client.redirectCallback, params, {
      state: req.cookies.state,
    });
    /* Cookie state has just been used to confirm
     * that rest-app has initiated the authentification request.
     * We can now delete it to prevent cookie from being reused
     * (which will certainly result in an error) */
    res.clearCookie('state');

    res.cookie(authorization.cookie.name, tokenset.access_token, {
      httpOnly: true,
      secure: false,
      domain: config.server.domain,
    });
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [authorizationCodeFlowAuth.name]: [] }],
  method: 'get',
  path: `/api/v1/auth/user/info`,
  description: 'Get user info',
  request: formatDoc.request(schemas.getUserInfo.request),
  responses: {
    200: {
      description: 'Return user info',
      content: {
        'application/json': { schema: schemas.getUserInfo.response[200] },
      },
    },
  },
});

router.get(
  '/auth/user/info',
  checkSessionCookie,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await getUserInfo(req.cookies[config.authorization.cookie.name]);
      return res.send(response);
    } catch (error) {
      return next(error);
    }
  }
);
registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [authorizationCodeFlowAuth.name]: [] }],
  method: 'get',
  path: `/api/v1/auth/logout`,
  description: 'Initiate logout from web app',
  request: formatDoc.request(schemas.initiateLogout.request),
  responses: {
    302: {
      description: 'Redirect user to ory hydra logout endpoint',
      headers: schemas.initiateLogout.response[302],
    },
  },
});

router.get('/auth/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await getOauth2Client();
    const data = await client.endSessionUrl();
    return res.redirect(data);
  } catch (error) {
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [{ [authorizationCodeFlowAuth.name]: [] }],
  method: 'get',
  path: `/api/v1/auth/logout/callback`,
  description:
    'Handle logout callback (remove session cookie) called by ory hydra (url of this route matches `post_logout_redirect` field from hydra config)',
  responses: {
    302: {
      description: 'Redirect user to oauth login page',
      headers: schemas.logoutCallback.response[302],
    },
  },
});

router.get('/auth/logout/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie(config.authorization.cookie.name, { domain: config.server.domain });
    const url = await getAuthUrl(res);
    return res.redirect(url);
  } catch (error) {
    return next(error);
  }
});

export default router;

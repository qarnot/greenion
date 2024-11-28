import express, { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { registry, formatDoc } from '@api/lib/openapi';
import { validator } from '@api/lib/validators';
import { UiNode } from '@ory/client';
import {
  OAuth2ApiAcceptOAuth2ConsentRequestRequest,
  AcceptOAuth2ConsentRequest,
} from '@ory/hydra-client';
import { frontendApi, identityApi, oauth2Api } from '@services/ory';
import { schemas } from './schemas';

const OPEN_API_TAGS = ['auth'];
const router = express.Router();

/* Init and get login flow data. */
registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [],
  method: 'get',
  path: `/api/v1/auth/login`,
  description: 'Generate new login flow',
  request: formatDoc.request(schemas.createLoginFlow.request),
  responses: {
    200: {
      description: 'Return `flowId` from ory kratos and `crsf_token` to prevent csrf attack',
      content: {
        'application/json': { schema: schemas.createLoginFlow.response[200] },
      },
    },
  },
});
router.get(
  '/auth/login',
  async (req: Request<{ login_challenge: string }>, res: Response, next: NextFunction) => {
    try {
      const { query } = validator(req, schemas.createLoginFlow.request);
      const response = await oauth2Api.getOAuth2LoginRequest({
        loginChallenge: query.login_challenge,
      });
      if (response.data.skip) {
        const result = await oauth2Api.acceptOAuth2LoginRequest({
          loginChallenge: query.login_challenge as string,
          acceptOAuth2LoginRequest: {
            subject: response.data.subject,
          },
        });
        return res.send(result.data);
      }
      const loginFlow = await frontendApi.createBrowserLoginFlow({
        loginChallenge: query.login_challenge as string,
      });
      res.setHeader('set-cookie', loginFlow.headers['set-cookie'] as string[]);

      const csrfNode = loginFlow.data.ui.nodes.find(
        node => (node.attributes as unknown as UiNode & { name: string }).name === 'csrf_token'
      );
      return res.send({
        id: loginFlow.data.id,
        csrfToken: (csrfNode?.attributes as unknown as UiNode & { value: string }).value,
      });
    } catch (error) {
      return next(error);
    }
  }
);

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [],
  method: 'get',
  path: `/api/v1/auth/consent`,
  description: 'Accept oauth2 consent request',
  request: formatDoc.request(schemas.acceptConsentRequest.request),
  responses: {
    200: {
      description:
        'Returns `redirect_to` url to which client should be redirected to. From this url, client will be redirect to callback url configured in oidc client',
      content: {
        'application/json': { schema: schemas.acceptConsentRequest.response[200] },
      },
    },
  },
});
router.get('/auth/consent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = validator(req, schemas.acceptConsentRequest.request);

    const challenge = await oauth2Api.getOAuth2ConsentRequest({
      consentChallenge: String(query.consent_challenge),
    });
    const { subject } = challenge.data;
    let role = 'user';
    if (!subject) {
      throw createHttpError(500, 'Missing subject in challenge');
    }
    const { data } = await identityApi.getIdentity({ id: subject });
    if (data.metadata_public) {
      role = (data.metadata_public as Record<string, string>).role;
    }
    const acceptOAuth2ConsentRequest: AcceptOAuth2ConsentRequest = {
      grant_scope: [...(challenge.data.requested_scope as string[]), role],
      grant_access_token_audience: challenge.data.requested_access_token_audience,
    };
    const acceptOAuth2ConsentRequestRequest: OAuth2ApiAcceptOAuth2ConsentRequestRequest = {
      consentChallenge: query.consent_challenge,
      acceptOAuth2ConsentRequest,
    };

    if (
      challenge.data.requested_scope?.includes('openid') &&
      challenge.data.requested_scope?.includes('email')
    ) {
      acceptOAuth2ConsentRequest.session = {
        id_token: {
          email: data.traits.email,
        },
      };
    }
    const response = await oauth2Api.acceptOAuth2ConsentRequest(acceptOAuth2ConsentRequestRequest);

    return res.send(response.data);
  } catch (error) {
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [],
  method: 'post',
  path: `/api/v1/auth/login/:flowId`,
  description: 'Complete login flow',
  request: formatDoc.request(schemas.updateLoginFlow.request),
  responses: {
    200: {
      description: 'Return session token',
      content: {
        'application/json': { schema: schemas.updateLoginFlow.response[200] },
      },
    },
    422: {
      description: 'Return url to consent to oauth2 request',
      content: {
        'application/json': { schema: schemas.updateLoginFlow.response[422] },
      },
    },
  },
});
router.post('/auth/login/:flowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params, body } = validator(req, schemas.updateLoginFlow.request);
    const loginFlow = await frontendApi.updateLoginFlow(
      {
        flow: params.flowId,
        updateLoginFlowBody: {
          csrf_token: body.csrfToken,
          identifier: body.email,
          password: body.password,
          method: 'password',
        },
        cookie: req.header('cookie'),
      },
      {
        headers: {
          cookie: req.header('cookie'),
        },
      }
    );
    res.setHeader('set-cookie', loginFlow.headers['set-cookie'] as string[]);
    return res.send(loginFlow);
  } catch (error: any) {
    if (error.response.status === 422) {
      return res.status(422).send(error.response.data);
    }
    if (error.response?.data?.ui?.messages) {
      return res.status(400).send(error.response.data.ui.messages);
    }
    return next(error);
  }
});

registry.registerPath({
  tags: OPEN_API_TAGS,
  security: [],
  method: 'get',
  path: `/api/v1/auth/logout`,
  description:
    'Accept logout request and redirect client to post logout url. It is called by ory hydra ',
  request: formatDoc.request(schemas.logout.request),
  responses: {
    302: {
      description: 'Redirect user to ory hydra logout endpoint',
      headers: schemas.logout.response[302],
    },
  },
});
router.get('/auth/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = validator(req, schemas.logout.request);
    const response = await oauth2Api.acceptOAuth2LogoutRequest({
      logoutChallenge: query.logout_challenge,
    });

    return res.redirect(response.data.redirect_to);
  } catch (error: any) {
    return next(error);
  }
});

export default router;

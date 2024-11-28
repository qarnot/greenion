import type { Express } from 'express';
import { logger } from '@lib/pino';

import authRoutesV1 from './components/v1/auth/routes';
import tokenRoutesV1 from './components/v1/token/routes';
import certificatesRoutesV1 from './components/v1/certificates/routes';
import adminUsersRoutesV1 from './components/v1/admin/users/routes';

import { generateOpenapi } from './lib/openapi';
import { checkAccessToken } from './middlewares';

const swaggerUi = require('swagger-ui-express');

function loadRoutes(app: Express) {
  if (process.env.NODE_ENV === 'development') {
    const openapi = generateOpenapi();
    app.use('/openapi', swaggerUi.serve, swaggerUi.setup(openapi));
    logger.info('OpenAPI documentation available at /openapi');
  }
  /**
   * NOTE: ABOUT API VERSIONING
   * Try to match versions between npm package and API.
   * Always keep older versions of API for backward compatibility
   */
  app.use(
    '/api/v1',
    // no middlewares at the moment
    // routers
    authRoutesV1
  );
  app.use(
    '/api/v1',
    // middlewares
    [checkAccessToken],
    // routers
    tokenRoutesV1,
    certificatesRoutesV1,
    adminUsersRoutesV1
  );
}

export default loadRoutes;

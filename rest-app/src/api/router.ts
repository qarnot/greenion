import type { Express } from 'express';
import { logger } from '@lib/pino';

import authRoutesV1 from '@api/components/v1/auth/routes';
import sessionRoutesV1 from '@api/components/v1/sessions/routes';
import machinesRoutesV1 from '@api/components/v1/machines/routes';
import adminUsersRoutesV1 from '@api/components/v1/admin/users/routes';
import { generateOpenapi } from '@api/lib/openapi';
import { checkSessionCookie } from '@api/middlewares/index';

// using CommonJS require because dependency is not compatible with ES module
const swaggerUi = require('swagger-ui-express');

function loadRoutes(app: Express) {
  const openapi = generateOpenapi();
  app.use('/openapi', swaggerUi.serve, swaggerUi.setup(openapi));
  logger.info('OpenAPI documentation available at /openapi');

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
    [checkSessionCookie],
    // routers
    sessionRoutesV1,
    machinesRoutesV1,
    adminUsersRoutesV1
  );
}

export default loadRoutes;

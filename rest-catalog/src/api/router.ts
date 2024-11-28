import type { Express } from 'express';
import { logger } from '@lib/pino';

import machinesRouter from './components/v1/machines/router';
import usersRouter from './components/v1/users/router';
import sessionsRouter from './components/v1/sessions/router';
import { generateOpenapi } from './lib/openapi';
import { checkAccessToken, checkAccessTokenOrVdi, isAdmin } from './middlewares/security';
import { addTransactionGetter } from './middlewares/transaction';

// using CommonJS require because dependency is not compatible with ES module
const swaggerUi = require('swagger-ui-express');

function loadRouters(app: Express) {
  const openapi = generateOpenapi();
  app.use('/openapi', swaggerUi.serve, swaggerUi.setup(openapi));
  logger.info('OpenAPI documentation available at /openapi');

  /**
   * NOTE: ABOUT API VERSIONING
   * Try to match versions between npm package and API.
   * Always keep older versions of API for backward compatibility
   */
  app.use(
    '/api/v1/users',
    // middlewares
    [checkAccessToken, addTransactionGetter],
    // routers
    usersRouter
  );
  app.use(
    '/api/v1/machines',
    // middlewares
    [checkAccessToken, isAdmin, addTransactionGetter],
    // routers
    machinesRouter
  );
  app.use(
    '/api/v1/sessions',
    // middlewares
    [checkAccessTokenOrVdi, addTransactionGetter],
    // routers
    sessionsRouter
  );
}

export { loadRouters };

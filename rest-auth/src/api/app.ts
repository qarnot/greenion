import express, { Express } from 'express';
import { server } from '@config';
import { loadMiddlewares } from './middlewares';
import loadRoutes from './router';
import { loadErrorHandlers } from './errors';

import 'types/express';

function createApp(): Express {
  // Create Express server
  const app = express();

  // set port listen
  app.set('port', server.port || 3000);

  // NOTE: order matters!

  loadMiddlewares(app);

  loadRoutes(app);

  loadErrorHandlers(app);

  return app;
}

export { createApp };

import type { Express } from 'express';
import cookieParser from 'cookie-parser';

import { logger } from '@lib/pino';
import compression from 'compression';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { authorization } from '@config';

import { checkSessionCookie, isAdmin } from './security';

const serverLogger = logger._.SERVER;

function loadMiddlewares(app: Express): void {
  // add http headers
  app.use(helmet());
  // compress requests and responses
  app.use(compression());
  app.use(cookieParser(authorization.cookie.secret));

  // actually `bodyParser` is not deprecated, the warning comes from a third party
  // which published (erroneous) types for this module
  // check this issue for details: https://github.com/expressjs/body-parser/issues/428
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'test') {
    // log every api calls
    app.use(morgan('dev', { stream: { write: line => serverLogger.info(line.trim()) } }));
  }
}

export { loadMiddlewares, checkSessionCookie, isAdmin };

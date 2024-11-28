import type { Server } from 'http';
import { logger } from '@lib/pino';

import { server as serverConfig } from '@config';

import { createApp } from '@api/app';

const serverLogger = logger._.SERVER;

/**
 * Start Express server.
 */
function start(): Server {
  const app = createApp();
  const server = app.listen(app.get('port'), () => {
    serverLogger.info(
      `App is running at http://${serverConfig.listenOn}:${serverConfig.port} in ${app.get(
        'env'
      )} mode`
    );
    serverLogger.info('Press CTRL-C to stop\n');
  });
  return server;
}

async function gracefulShutdown(server: Server): Promise<void> {
  logger.info('Performing graceful shutdown...');
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        logger.error('Error while performing graceful shutdown:', error.message || 'unknown error');
        return reject(error);
      }
      logger.info('Graceful shutdown done.');
      return resolve();
    });
  });
}

export { start, gracefulShutdown };

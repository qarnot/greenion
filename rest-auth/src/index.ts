import type { Server } from 'http';

import { start, gracefulShutdown } from '@api/server';

import { logger } from '@lib/pino';

async function main() {
  let server: Server;
  try {
    server = start();
    process.on('SIGTERM', async () => {
      await gracefulShutdown(server);
      process.exit(0);
    });
  } catch (error: any) {
    logger.error('Unhandled error:', error.message);
    if (server! !== undefined) {
      await gracefulShutdown(server);
    }
    process.exit(1);
  }
}

main();

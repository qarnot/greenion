import { logger } from '@lib/pino';

import type { Server } from 'http';

import { start, gracefulShutdown } from '@api/server';
import { performMigrations } from '@db';

async function main() {
  let server: Server;
  try {
    await performMigrations();
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

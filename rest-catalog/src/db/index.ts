import '@db/data';
import * as config from '@config';
import * as migrations from '@db/lib/migrations';
import * as seeds from '@db/lib/seeds';

import { logger as pinoLogger } from '@lib/pino';

const logger = pinoLogger._.DB;

/**
 * run sequelize migrations if needed
 */
async function performMigrations() {
  try {
    if (config.sequelize?.migrations === 'up') {
      await migrations.up();
    } else if (config.sequelize?.migrations === 'down') {
      await migrations.down();
    }
    if (config.sequelize?.seeds === 'up') {
      await seeds.up();
    } else if (config.sequelize?.seeds === 'down') {
      await seeds.down();
    }
  } catch (error: any) {
    if (error.errors) logger.error('Sequelize migration error:', JSON.stringify(error, null, 2));
    else
      logger.error('Sequelize migration error:', error.message || JSON.stringify(error, null, 2));
  }
}

/**
 * wait until all pending migrations have been ran.
 * this is to be used by other processes (different from main process) which require migrations to be ran before starting
 * however migrations are only executed by main process to avoid running migrations from different processes at the same time
 */
async function waitMigrations() {
  if (config.sequelize?.migrations === 'up') {
    await migrations.waitForMigrationsUp();
  } else if (config.sequelize?.migrations === 'down') {
    await migrations.waitForMigrationsDown();
  }
  if (config.sequelize?.seeds === 'up') {
    await seeds.waitForSeedsUp();
  } else if (config.sequelize?.seeds === 'down') {
    await seeds.waitForSeedsDown();
  }
}

export { performMigrations, waitMigrations };

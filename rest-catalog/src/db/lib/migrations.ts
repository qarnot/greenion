import type { MigrateDownOptions } from 'umzug';

import { join } from 'node:path';
import { logger as pinoLogger } from '@lib/pino';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './sequelize';
import { umzugDown, umzugUp, waitForUmzugDown, waitForUmzugUp } from './umzug';

const logger = pinoLogger._.MIGRATIONS;

const umzug = new Umzug({
  migrations: {
    glob: `${join(__dirname, '../migrations')}/*.{js,ts}`,
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger,
});

async function up() {
  await umzugUp({
    umzugInstance: umzug,
    logger,
    label: 'migrations',
  });
}

async function down(downOptions?: MigrateDownOptions) {
  await umzugDown({
    umzugInstance: umzug,
    logger,
    label: 'migration',
    downOptions,
  });
}

async function waitForMigrationsUp() {
  await waitForUmzugUp(umzug, logger, 'migrations');
}

async function waitForMigrationsDown() {
  await waitForUmzugDown(umzug, logger, 'migration');
}

export { up, down, waitForMigrationsDown, waitForMigrationsUp };

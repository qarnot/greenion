import type { MigrateDownOptions } from 'umzug';

import { join } from 'node:path';
import { Umzug, SequelizeStorage } from 'umzug';
import { logger as pinoLogger } from '@lib/pino';
import { sequelize } from './sequelize';
import { umzugDown, umzugUp, waitForUmzugDown, waitForUmzugUp } from './umzug';

const logger = pinoLogger._.SEEDS;

const umzug = new Umzug({
  migrations: {
    glob: `${join(__dirname, '../seeders')}/*.{js,ts}`,
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'SequelizeData', // default sequelize seed storage
    modelName: 'SequelizeData',
  }),
  logger,
});

async function up() {
  await umzugUp({
    umzugInstance: umzug,
    logger,
    label: 'seeds',
  });
}

async function down(downOptions?: MigrateDownOptions) {
  await umzugDown({
    umzugInstance: umzug,
    logger,
    label: 'seed',
    downOptions,
  });
}

async function waitForSeedsUp() {
  await waitForUmzugUp(umzug, logger, 'seeds');
}

async function waitForSeedsDown() {
  await waitForUmzugDown(umzug, logger, 'seed');
}

export { up, down, waitForSeedsDown, waitForSeedsUp };

import type { QueryInterface } from 'sequelize';
import type { MigrationMeta, MigrateDownOptions } from 'umzug';
import { Umzug } from 'umzug';

/**
 * internal function, just here to refactor the multiple waiting loops
 * - wait 1s
 * - return list of pending migrations
 */
async function getPendingAndWait(umzugInstance: Umzug<QueryInterface>) {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise(resolve => setTimeout(resolve, 1000));
  const pendingMigrations = await umzugInstance.pending();
  return pendingMigrations;
}

/**
 * wait for umzug.up to be ran:
 * list pending migrations and wait until there is none left
 */
async function waitForUmzugUp(
  umzugInstance: Umzug<QueryInterface>,
  logger: any,
  label: 'migrations' | 'seeds'
) {
  let pendingMigrations: MigrationMeta[] = await umzugInstance.pending();
  // if there is pending migrations, we keep waiting
  while (pendingMigrations.length > 0) {
    logger.info(`Wait for ${label} [${pendingMigrations.map(m => m.name).join(', ')}] to run...`);
    // eslint-disable-next-line no-await-in-loop
    pendingMigrations = await getPendingAndWait(umzugInstance);
  }
  logger.info(`${label} completed`);
}

/**
 * wait for umzug.down to be ran:
 * list pending migrations and wait until there is at least 1
 */
async function waitForUmzugDown(
  umzugInstance: Umzug<QueryInterface>,
  logger: any,
  label: 'migration' | 'seed'
) {
  let pendingMigrations: MigrationMeta[] = await umzugInstance.pending();
  /**
   * if we wait for umzug.down, we expect at least 1 item in pending migrations
   * unfortunately, this will only work for the 1st undo
   * but it's not likely that we need to down multiple migrations IRL
   *
   * worst case scenario: some script starts before a migration is undone
   * might crashes for sequelize errors and need another restart.
   */
  while (pendingMigrations.length === 0) {
    logger.info(`Wait for ${label} down...`);
    // eslint-disable-next-line no-await-in-loop
    pendingMigrations = await getPendingAndWait(umzugInstance);
  }
  logger.info(`${label} completed`);
}

type UmzugUpParams = {
  umzugInstance: Umzug<QueryInterface>;
  logger: any; // todo, add qarnot logger type when exist
  label: 'migrations' | 'seeds';
};
async function umzugUp({ umzugInstance, logger, label }: UmzugUpParams) {
  logger.info(`Performing sequelize ${label}...`);
  // checks migrations and run them if they are not already applied
  const executedMigrations: MigrationMeta[] = await umzugInstance.up();
  executedMigrations.forEach(migration => {
    logger.info(`'${migration.name}' ${label} performed successfully`);
  });
  logger.info('Done!');
}

type UmzugDownParams = {
  umzugInstance: Umzug<QueryInterface>;
  logger: any; // todo, add qarnot logger type when exist
  label: 'migration' | 'seed';
  downOptions?: MigrateDownOptions;
};
async function umzugDown({ umzugInstance, logger, label, downOptions }: UmzugDownParams) {
  logger.info(`Reverting last sequelize ${label}...`);
  // undo latest seed done
  const revertedSeeds: MigrationMeta[] = await umzugInstance.down(downOptions);
  logger.info(`'${revertedSeeds[0].name}' ${label} reverted successfully`);
  logger.info('Done!');
}

export { waitForUmzugUp, waitForUmzugDown, umzugUp, umzugDown };

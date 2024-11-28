import type { Transaction } from 'sequelize';

import { Sequelize } from 'sequelize';
import { logger as pinoLogger } from '@lib/pino';

// we are using `require` syntax because module is exported as CommonJS on purpose (see comment in file for details)
const configDB = require('../config_db');

const logger = pinoLogger._.SEQUELIZE;

// function logging(sql: string, timing?: number | undefined) {
function logging(sql: string) {
  logger.trace(sql);
  // logger.trace(timing);
}

const sequelize = new Sequelize(configDB.database, configDB.username, configDB.password, {
  host: configDB.host,
  port: configDB.port,
  dialect: configDB.dialect,
  logging: configDB.logging ? logging : false,
});

interface CommonModelAttributes {
  readonly id: number;
}

// https://sequelize.org/v5/manual/models-definition.html#timestamps
interface TimestampsAttributes extends CommonModelAttributes {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// see https://sequelize.org/master/manual/paranoid.html
interface ParanoidAttributes extends CommonModelAttributes {
  readonly deletedAt: Date | null;
}

interface ParanoidTimeStampsAttributes extends TimestampsAttributes, ParanoidAttributes {}

/**
 * We overload sequelize transaction type because this type is missing some fields
 * that are actually present in the transaction object.
 * We only define `finished` because that's the only one we need yet
 */
interface EnrichedTransaction extends Transaction {
  finished?: 'rollback' | 'commit';
  safeRollback: () => Promise<void>;
}

async function getEnrichedTransaction(safeRollback?: () => Promise<void>) {
  const baseTransaction = await sequelize.transaction();

  // poor typing solution since transaction is not "enriched" until next line, but I didn't found a better way
  const transaction = baseTransaction as EnrichedTransaction;

  const defaultRollback = () => transaction.rollback();
  transaction.safeRollback = safeRollback ?? defaultRollback;

  return transaction;
}

export type {
  CommonModelAttributes,
  TimestampsAttributes,
  ParanoidAttributes,
  ParanoidTimeStampsAttributes,
  EnrichedTransaction,
};

export { sequelize, Sequelize, getEnrichedTransaction };

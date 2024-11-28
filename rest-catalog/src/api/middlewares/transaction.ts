import { Request, Response, NextFunction } from 'express';
import { sequelize, EnrichedTransaction } from '@db/lib/sequelize';

import { logger } from '@lib/pino';

function addTransactionGetter(req: Request, res: Response, next: NextFunction) {
  try {
    let transaction: EnrichedTransaction;
    const getTransaction = async () => {
      if (transaction) return transaction;

      const baseTransaction = await sequelize.transaction();

      const safeRollback = async () => {
        try {
          if (transaction && !transaction.finished) {
            await transaction.rollback();
          }
        } catch (error: any) {
          logger.error('Transaction rollback error:', error.message);
          next(error);
        }
      };

      // poor typing solution since transaction is not "enriched" until next line, but I didn't found a better way
      transaction = baseTransaction as EnrichedTransaction;
      transaction.safeRollback = safeRollback;
      return transaction;
    };

    req.getTransaction = getTransaction;
    return next();
  } catch (error) {
    return next(error);
  }
}

export { addTransactionGetter };

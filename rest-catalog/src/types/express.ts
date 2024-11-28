import { EnrichedTransaction } from '@db/lib/sequelize';

export {};

declare global {
  namespace Express {
    interface Request {
      session: {
        subject: string;
        isAdmin: boolean;
      };
      getTransaction: () => Promise<EnrichedTransaction>;
    }
  }
}

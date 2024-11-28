import { Machine } from './machine';
import { User } from './user';

type Session = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  closedAt: string | null;
  userId: number | null;
  machineId: number | null;
  userMachineId: number | null;
  userMachine?: {
    userId?: number;
    machineId?: number;
    machine?: Machine;
    user?: User;
  };
};

export type { Session };

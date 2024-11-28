import type { User } from './user';
import type { Session } from './session';

type Machine = {
  id: number;
  name: string;
  ip: string;
  port: number;
  externalIp: string;
  externalPort: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user: User;
  sessions?: Session[];
};

export type { Machine };

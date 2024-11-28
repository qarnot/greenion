type Machine = {
  readonly id: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  ip: string;
  port: number;
  externalIp: string;
  externalPort: number;
};

type MachineInput = Omit<Machine, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type { Machine, MachineInput };

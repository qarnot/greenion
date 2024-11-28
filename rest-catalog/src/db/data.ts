import type { Machine } from '@api/components/v1/machines/model';
import type { User } from '@api/components/v1/users/model';
import type { UsersMachinesAssociation } from '@api/components/v1/users-machines/model';
import type { Session } from '@api/components/v1/sessions/model';

import { MachineFactory } from '@api/components/v1/machines/model';
import { UserFactory } from '@api/components/v1/users/model';
import { UsersMachinesAssociationFactory } from '@api/components/v1/users-machines/model';
import { SessionFactory } from '@api/components/v1/sessions/model';
import { sequelize } from '@db/lib/sequelize';

const TABLE_NAMES = {
  machines: 'machines',
  users: 'users',
  sessions: 'sessions',
  // M:N associations
  users_machines: 'users_machines',
};
interface Models {
  machine: Machine.Static;
  user: User.Static;
  // specific model for M:N association
  users_machines: UsersMachinesAssociation.Static;
  session: Session.Static;
}

const models: Models = {
  machine: MachineFactory(sequelize),
  user: UserFactory(sequelize),
  users_machines: UsersMachinesAssociationFactory(sequelize),
  session: SessionFactory(sequelize),
};

interface Associations {
  user: User.Associations;
  machine: Machine.Associations;
  users_machines: UsersMachinesAssociation.Associations;
  session: Session.Associations;
}

const associations: Associations = Object.entries(models).reduce(
  (prevAssociations: any, [modelName, model]: [string, Models[keyof Models]]) => {
    const modelAssociations = model.associate(models);
    return {
      ...prevAssociations,
      [modelName]: modelAssociations,
    };
  },
  {}
);

export type { User, Machine, UsersMachinesAssociation, Session, Models, Associations };

export { TABLE_NAMES, models, associations };

import type * as Sequelize from 'sequelize';
import type { Models, UsersMachinesAssociation, User, Machine } from '@db/data';

import { DataTypes } from 'sequelize';
import { singularize } from 'inflection';
import { TABLE_NAMES } from '@db/data';

namespace Session {
  export interface CreationAttributes {
    closedAt?: Date | null;
    // foreignKey
    userMachineId?: UsersMachinesAssociation.Instance['id'];
  }

  // using search attributes for Session model becuase we do not want to let user play with users_machines directly
  export interface SearchAttributes extends CreationAttributes {
    userId?: User.Instance['id'];
    machineId?: Machine.Instance['id'];
  }

  export interface Attributes extends CreationAttributes {
    readonly id: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
  }

  interface PrototypeMethods {
    // if need to add methods to model.prototype, define types here
  }

  export interface Instance
    extends Sequelize.Model<Attributes, CreationAttributes>,
      Attributes,
      PrototypeMethods {
    dataValues: Attributes;
    prototype: PrototypeMethods;

    // mixins of session.belongsTo(models.users_machines);
    getUserMachine: Sequelize.BelongsToGetAssociationMixin<UsersMachinesAssociation.Instance>;
    setUserMachine: Sequelize.BelongsToSetAssociationMixin<
      UsersMachinesAssociation.Instance,
      UsersMachinesAssociation.Instance['id']
    >;
    createUserMachine: Sequelize.BelongsToCreateAssociationMixin<UsersMachinesAssociation.Instance>;
  }

  export type Associations = {
    users_machines: UsersMachinesAssociation.Static;
  };

  // NOTE: restrict nested assocations to 1 level only
  export type NestedAssociations = 'user' | 'machine';

  export type Static = typeof Sequelize.Model & {
    new (): Instance;
    associate: (models: Models) => Associations;
  };
}

function SessionFactory(sequelize: Sequelize.Sequelize): Session.Static {
  const session = <Session.Static>sequelize.define(
    // by default sequelize is using singular for model's name and plural for table's name
    // for details see: https://sequelize.org/docs/v6/other-topics/naming-strategies/#singular-vs-plural
    singularize(TABLE_NAMES.sessions),
    {
      closedAt: {
        allowNull: true,
        type: DataTypes.DATE,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      defaultScope: {
        // default scope to apply to all find queries, will only return following attributes
        attributes: ['id', 'createdAt', 'closedAt'],
      },
    }
  );

  session.associate = (models: Models): Session.Associations => {
    session.belongsTo(models.users_machines, { as: 'userMachine', foreignKey: 'userMachineId' });

    return {
      users_machines: models.users_machines,
    };
  };

  return session;
}

export type { Session };
export { SessionFactory };

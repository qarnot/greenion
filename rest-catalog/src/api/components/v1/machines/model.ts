import type * as Sequelize from 'sequelize';

import { DataTypes } from 'sequelize';
import { singularize } from 'inflection';
import { Models, TABLE_NAMES, User } from '@db/data';

namespace Machine {
  export interface CreationAttributes {
    ip: string;
    port: number;
    externalIp: string;
    externalPort: number;
    name?: string;
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

    // mixins of machine.belongsToMany(models.users, { through: models.users_machines, ...)
    getUsers: Sequelize.BelongsToManyGetAssociationsMixin<User.Instance>;
    setUsers: Sequelize.BelongsToManySetAssociationsMixin<User.Instance, User.Instance['id']>;
    addUsers: Sequelize.BelongsToManyAddAssociationsMixin<User.Instance, User.Instance['id']>;
    addUser: Sequelize.BelongsToManyAddAssociationMixin<User.Instance, User.Instance['id']>;
    createUser: Sequelize.BelongsToManyCreateAssociationMixin<User.Instance>;
    removeUser: Sequelize.BelongsToManyRemoveAssociationMixin<User.Instance, User.Instance['id']>;
    removeUsers: Sequelize.BelongsToManyRemoveAssociationsMixin<User.Instance, User.Instance['id']>;
    hasUser: Sequelize.BelongsToManyHasAssociationMixin<User.Instance, User.Instance['id']>;
    hasUsers: Sequelize.BelongsToManyHasAssociationsMixin<User.Instance, User.Instance['id']>;
    countUsers: Sequelize.BelongsToManyCountAssociationsMixin;
  }

  export type Associations = {
    user: User.Static;
  };

  // NOTE: restrict nested assocations to 1 level only
  export type NestedAssociations = 'user';

  export type Static = typeof Sequelize.Model & {
    new (): Instance;
    associate: (models: Models) => Associations;
  };
}

function MachineFactory(sequelize: Sequelize.Sequelize): Machine.Static {
  const machine = <Machine.Static>sequelize.define(
    // by default sequelize is using singular for model's name and plural for table's name
    // for details see: https://sequelize.org/docs/v6/other-topics/naming-strategies/#singular-vs-plural
    singularize(TABLE_NAMES.machines),
    {
      ip: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
        defaultValue: null,
      },
      port: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      externalIp: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      externalPort: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      defaultScope: {
        // default scope to apply to all find queries, will only return following attributes
        attributes: ['id', 'name', 'ip', 'port', 'externalIp', 'externalPort', 'createdAt'],
      },
    }
  );

  machine.associate = (models: Models): Machine.Associations => {
    machine.belongsToMany(models.user, {
      through: models.users_machines,
    });

    return {
      user: models.user,
    };
  };

  return machine;
}

export type { Machine };
export { MachineFactory };

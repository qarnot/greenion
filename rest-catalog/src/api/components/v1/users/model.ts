import type * as Sequelize from 'sequelize';

import { DataTypes } from 'sequelize';
import { singularize } from 'inflection';
import { Models, TABLE_NAMES, Machine } from '@db/data';

namespace User {
  export interface CreationAttributes {
    uuid: string;
  }

  export interface Attributes extends CreationAttributes {
    readonly id: number;
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

    // mixins of user.belongsToMany(models.machines, { through: models.users_machines, ...)
    getMachines: Sequelize.BelongsToManyGetAssociationsMixin<Machine.Instance>;
    setMachines: Sequelize.BelongsToManySetAssociationsMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    addMachines: Sequelize.BelongsToManyAddAssociationsMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    addMachine: Sequelize.BelongsToManyAddAssociationMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    createMachine: Sequelize.BelongsToManyCreateAssociationMixin<Machine.Instance>;
    removeMachine: Sequelize.BelongsToManyRemoveAssociationMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    removeMachines: Sequelize.BelongsToManyRemoveAssociationsMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    hasMachine: Sequelize.BelongsToManyHasAssociationMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    hasMachines: Sequelize.BelongsToManyHasAssociationsMixin<
      Machine.Instance,
      Machine.Instance['id']
    >;
    countMachines: Sequelize.BelongsToManyCountAssociationsMixin;
  }

  export type Associations = {
    machine: Machine.Static;
  };

  // NOTE: restrict nested assocations to 1 level only
  export type NestedAssociations = 'machine';

  export type Static = typeof Sequelize.Model & {
    new (): Instance;
    associate: (models: Models) => Associations;
  };
}

function UserFactory(sequelize: Sequelize.Sequelize): User.Static {
  const user = <User.Static>sequelize.define(
    // by default sequelize is using singular for model's name and plural for table's name
    // for details see: https://sequelize.org/docs/v6/other-topics/naming-strategies/#singular-vs-plural
    singularize(TABLE_NAMES.users),
    {
      uuid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      defaultScope: {
        // default scope to apply to all find queries, will only return following attributes
        attributes: ['id', 'uuid', 'createdAt'],
      },
    }
  );

  user.associate = (models: Models): User.Associations => {
    user.belongsToMany(models.machine, {
      through: models.users_machines,
    });

    return {
      machine: models.machine,
    };
  };

  return user;
}

export type { User };
export { UserFactory };

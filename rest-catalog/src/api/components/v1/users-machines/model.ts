/** NOTE
 * This model is a bit specific because it is used to represent M:N association between User & Machine models + Session
 * It is not intented to use as other components, that's why there is no service, no dto, no router
 */

import type * as Sequelize from 'sequelize';
import type { Models, User, Machine, Session } from '@db/data';

import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '@db/data';

namespace UsersMachinesAssociation {
  export interface CreationAttributes {}

  export interface Attributes extends CreationAttributes {
    readonly id: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    // foreignKey
    readonly userId: User.Instance['id'];
    readonly machineId: Machine.Instance['id'];
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

    // mixins of model.hasMany(models.session, { foreignKey: 'userMachineId' })
    getSessions: Sequelize.HasManyGetAssociationsMixin<Session.Instance>;
    setSessions: Sequelize.HasManySetAssociationsMixin<Session.Instance, Session.Instance['id']>;
    addSessions: Sequelize.HasManyAddAssociationsMixin<Session.Instance, Session.Instance['id']>;
    addSession: Sequelize.HasManyAddAssociationMixin<Session.Instance, Session.Instance['id']>;
    createSession: Sequelize.HasManyCreateAssociationMixin<Session.Instance>;
    removeSession: Sequelize.HasManyRemoveAssociationMixin<
      Session.Instance,
      Session.Instance['id']
    >;
    removeSessions: Sequelize.HasManyRemoveAssociationsMixin<
      Session.Instance,
      Session.Instance['id']
    >;
    hasSessions: Sequelize.HasManyHasAssociationMixin<Session.Instance, Session.Instance['id']>;
    countSessions: Sequelize.HasManyCountAssociationsMixin;

    // mixins of model.belongsTo(models.user)
    getUser: Sequelize.BelongsToGetAssociationMixin<User.Instance>;
    setUser: Sequelize.BelongsToSetAssociationMixin<User.Instance, User.Instance['id']>;
    createUser: Sequelize.BelongsToCreateAssociationMixin<User.Instance>;

    // mixins of model.belongsTo(models.machine)
    getMachine: Sequelize.BelongsToGetAssociationMixin<Machine.Instance>;
    setMachine: Sequelize.BelongsToSetAssociationMixin<Machine.Instance, Machine.Instance['id']>;
    createMachine: Sequelize.BelongsToCreateAssociationMixin<Machine.Instance>;
  }

  export type Associations = {
    session: Session.Static;
    // "super" M:N association
    user: User.Static;
    machine: Machine.Static;
  };

  // NOTE: not used here as this model is an association model
  export type NestedAssociations = '';

  export type Static = typeof Sequelize.Model & {
    new (): Instance;
    associate: (models: Models) => Associations;
  };
}

function UsersMachinesAssociationFactory(
  sequelize: Sequelize.Sequelize
): UsersMachinesAssociation.Static {
  const model = <UsersMachinesAssociation.Static>sequelize.define(
    // NOTE: we do not care how seqeulize is treating model's name (singular/plural) here
    // because this is an association model used alongside alias (for example see `sessions` model)
    TABLE_NAMES.users_machines,
    {
      // usually we are not defining PK in model file (only in migration files),
      // however it is not possible to pass an empty object `{}` as arg
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      freezeTableName: true, // indicate sequelize to not try to plurialize model name for table
      defaultScope: {
        // default scope to apply to all find queries, will only return following attributes
        attributes: ['userId', 'machineId'],
      },
    }
  );

  model.associate = (models: Models): UsersMachinesAssociation.Associations => {
    model.hasMany(models.session, { foreignKey: 'userMachineId' });
    // "super" M:N association: necessary to easily retrieve user/machine linked to session
    // see https://sequelize.org/docs/v6/advanced-association-concepts/advanced-many-to-many/#through-tables-versus-normal-tables-and-the-super-many-to-many-association
    model.belongsTo(models.user);
    model.belongsTo(models.machine);

    return {
      session: models.session,
      // "super" M:N association
      user: models.user,
      machine: models.machine,
    };
  };

  return model;
}

export type { UsersMachinesAssociation };
export { UsersMachinesAssociationFactory };

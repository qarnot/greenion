import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '@db/data';

function up({ context: queryInterface }: { context: QueryInterface }) {
  return queryInterface.createTable(TABLE_NAMES.sessions, {
    // primary keys
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    // attributes
    closedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
    // foreign keys
    userMachineId: {
      type: DataTypes.INTEGER.UNSIGNED,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: TABLE_NAMES.users_machines,
        key: 'id',
      },
      allowNull: false,
    },
    // timestamps, paranoid options
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  });
}

function down({ context: queryInterface }: { context: QueryInterface }) {
  return queryInterface.dropTable(TABLE_NAMES.sessions);
}

export { up, down };

import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '@db/data';

function up({ context: queryInterface }: { context: QueryInterface }) {
  return queryInterface.createTable(TABLE_NAMES.users, {
    // primary keys
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    // attributes
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
  return queryInterface.dropTable(TABLE_NAMES.users);
}

export { up, down };

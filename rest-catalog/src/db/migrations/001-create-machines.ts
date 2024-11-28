import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '@db/data';

function up({ context: queryInterface }: { context: QueryInterface }) {
  return queryInterface.createTable(TABLE_NAMES.machines, {
    // primary keys
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
    },
    // attributes
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    externalIp: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    externalPort: {
      type: DataTypes.INTEGER,
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
  return queryInterface.dropTable(TABLE_NAMES.machines);
}

export { up, down };

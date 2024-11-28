import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '@db/data';

function up({ context: queryInterface }: { context: QueryInterface }) {
  return queryInterface.addColumn(TABLE_NAMES.machines, 'name', {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
  });
}

function down({ context: queryInterface }: { context: QueryInterface }) {
  return queryInterface.removeColumn(TABLE_NAMES.machines, 'name');
}

export { up, down };

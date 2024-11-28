/** Import types *************************************************************************************************** */
import type { FindOptions, CreateOptions } from 'sequelize';
import type { Machine, User } from '@db/data';
import type { QueryOptions } from '@db/helpers/query';

/** Import deps **************************************************************************************************** */
import createHttpError from 'http-errors';
import { models } from '@db/data';
import { cleanWhereParams } from '@db/helpers/query';

const DEFAULT_INCLUDES: Machine.NestedAssociations[] = [];

const CREATION_ATTRIBUTE_NAMES: (keyof Machine.CreationAttributes)[] = [
  'ip',
  'name',
  'port',
  'externalIp',
  'externalPort',
];

function cleanSearchParams(
  params: Partial<Machine.CreationAttributes>
): Partial<Machine.Attributes> {
  const cleanedParams: Partial<Machine.CreationAttributes> = {
    ip: params.ip,
    name: params.name,
    port: params.port,
    externalIp: params.externalIp,
    externalPort: params.externalPort,
  };
  return cleanWhereParams(cleanedParams, CREATION_ATTRIBUTE_NAMES);
}

function getIncludeOptions(includes: Machine.NestedAssociations[]): FindOptions {
  if (includes.length === 0) return {};

  return {
    include: includes.map(modelName => ({
      model: models[modelName],
      through: { attributes: [] },
    })),
  };
}

/** CRUD methods *************************************************************************************************** */

function list(
  searchParams: Partial<Machine.CreationAttributes>,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Machine.NestedAssociations>
): Promise<Machine.Instance[]> {
  const options: FindOptions<Machine.Attributes> = {
    where: cleanSearchParams(searchParams),
    ...getIncludeOptions(includes),
    transaction,
  };
  return models.machine.findAll(options);
}

async function getById(
  id: Machine.Instance['id'],
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Machine.NestedAssociations>
): Promise<Machine.Instance> {
  const options: FindOptions<Machine.Attributes> = {
    ...getIncludeOptions(includes),
    transaction,
  };
  const machine = await models.machine.findByPk(id, options);

  if (!machine) throw createHttpError(404, 'Machine not found');

  return machine;
}

async function create(
  params: Machine.CreationAttributes,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Machine.NestedAssociations>
): Promise<Machine.Instance> {
  const getOptions: CreateOptions<Machine.Attributes> = getIncludeOptions(includes);

  let machine = await models.machine.findOne({
    where: cleanSearchParams(params),
    paranoid: false, // to get soft-deleted results too
    transaction,
  });

  if (!machine) {
    machine = await models.machine.create(params, { transaction });
  } else {
    await machine.restore({ transaction });
  }

  return machine.reload({ ...getOptions, transaction });
}

async function update(
  id: Machine.Instance['id'],
  params: Partial<Machine.CreationAttributes>,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Machine.NestedAssociations>
): Promise<Machine.Instance> {
  const machine = await getById(id, { includes, transaction });
  await machine.update(params, { transaction });
  return machine.reload({ transaction });
}

async function destroy(
  id: Machine.Instance['id'],
  { transaction }: QueryOptions<Machine.NestedAssociations>
): Promise<void> {
  const machine = await getById(id, { transaction });
  return machine.destroy({ transaction });
}

/** Specific methods *********************************************************************************************** */

async function getUsersById(
  id: Machine.Instance['id'],
  { transaction }: QueryOptions<Machine.NestedAssociations>
): Promise<User.Instance[]> {
  const options: QueryOptions<Machine.NestedAssociations> = {
    includes: ['user'],
    transaction,
  };

  const machine = await getById(id, options);
  const users = await machine.getUsers({ transaction, joinTableAttributes: [] });
  return users || [];
}

/** Exports ******************************************************************************************************** */

export type {};

export { list, getById, create, update, destroy, getUsersById };

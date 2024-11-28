/** TYPES ********************************************************************************************************** */
import type { FindOptions, CreateOptions } from 'sequelize';
import type { Session, User, Machine, UsersMachinesAssociation } from '@db/data';
import type { QueryOptions } from '@db/helpers/query';

/** DEPS *********************************************************************************************************** */
import createHttpError from 'http-errors';
import { models } from '@db/data';
import { cleanWhereParams } from '@db/helpers/query';

const DEFAULT_INCLUDES: Session.NestedAssociations[] = ['user', 'machine'];

const CREATION_ATTRIBUTE_NAMES: (keyof Session.CreationAttributes)[] = [
  'closedAt',
  'userMachineId',
];

const CREATION_ATTRIBUTE_NAMES_USER_MACHINE: (keyof Partial<Session.SearchAttributes>)[] = [
  'userId',
  'machineId',
];

function cleanSearchParams(
  params: Partial<Session.CreationAttributes>
): Partial<Session.Attributes> {
  const cleanedParams: Partial<Session.Attributes> = {
    userMachineId: params.userMachineId,
    closedAt: params.closedAt,
  };
  return cleanWhereParams(cleanedParams, CREATION_ATTRIBUTE_NAMES);
}

function getIncludeOptions(
  includes: Session.NestedAssociations[],
  searchParams: Partial<Session.SearchAttributes> = {}
): FindOptions {
  if (includes.length === 0 && Object.keys(searchParams).length === 0) return {};

  // logic added here to handle nested where filters
  const cleanedParams: Partial<Session.SearchAttributes> = {
    userId: searchParams.userId,
    machineId: searchParams.machineId,
  };
  const whereParams = cleanWhereParams(cleanedParams, CREATION_ATTRIBUTE_NAMES_USER_MACHINE);

  return {
    include: {
      model: models.users_machines,
      as: 'userMachine',
      include: includes.map(modelName => models[modelName]),
      where: whereParams,
    },
  };
}

/** Specific methods *********************************************************************************************** */

async function getUserMachine(
  userId: User.Instance['id'],
  machineId: Machine.Instance['id'],
  { transaction }: QueryOptions<Session.NestedAssociations>
): Promise<UsersMachinesAssociation.Instance> {
  const userMachine = await models.users_machines.findOne({
    where: { userId, machineId },
    transaction,
    attributes: ['id'],
  });
  if (!userMachine) {
    throw createHttpError(403, 'User has no access to machine');
  }
  return userMachine;
}

/** CRUD methods *************************************************************************************************** */
async function list(
  searchParams: Partial<Session.SearchAttributes>,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Session.NestedAssociations>
): Promise<Session.Instance[]> {
  const options: FindOptions<Session.Attributes> = {
    where: cleanSearchParams(searchParams),
    ...getIncludeOptions(includes, searchParams),
    transaction,
  };
  return models.session.findAll(options);
}

async function getById(
  id: Session.Instance['id'],
  {
    includes = DEFAULT_INCLUDES,
    transaction,
    paranoid = true,
  }: QueryOptions<Session.NestedAssociations>
): Promise<Session.Instance> {
  const options: FindOptions<Session.Attributes> = {
    ...getIncludeOptions(includes),
    transaction,
    paranoid,
  };
  const session = await models.session.findByPk(id, options);

  if (!session) throw createHttpError(404, 'Session not found');

  return session;
}

async function create(
  userId: User.Instance['id'],
  machineId: Machine.Instance['id'],
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Session.NestedAssociations>
): Promise<Session.Instance> {
  const userMachine = await getUserMachine(userId, machineId, { transaction });
  const session = await models.session.create({ userMachineId: userMachine.id }, { transaction });
  const options: CreateOptions<Session.Attributes> = getIncludeOptions(includes);
  return session.reload({ ...options, transaction });
}

async function update(
  id: Session.Instance['id'],
  params: Partial<Session.CreationAttributes>,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<Session.NestedAssociations>
): Promise<Session.Instance> {
  const session = await getById(id, { includes, transaction });
  await session.update(params, { transaction });
  const options: FindOptions<Session.Attributes> = getIncludeOptions(includes);
  return session.reload({ ...options, transaction });
}

async function destroy(
  id: number,
  { transaction }: QueryOptions<Session.NestedAssociations>
): Promise<void> {
  const session = await getById(id, { transaction });
  return session.destroy({ transaction });
}

export type {};

export { list, getById, create, update, destroy };

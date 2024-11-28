/** Import types *************************************************************************************************** */
import { FindOptions, CreateOptions } from 'sequelize';
import type { User, Machine, UsersMachinesAssociation, Session } from '@db/data';
import type { QueryOptions } from '@db/helpers/query';

/** Import deps **************************************************************************************************** */
import createHttpError from 'http-errors';
import { models } from '@db/data';
import { cleanWhereParams } from '@db/helpers/query';
import { getById as getMachineById } from '@api/components/v1/machines/service';

const DEFAULT_INCLUDES: User.NestedAssociations[] = [];

const CREATION_ATTRIBUTE_NAMES: (keyof User.CreationAttributes)[] = ['uuid'];

function cleanSearchParams(params: Partial<User.CreationAttributes>): Partial<User.Attributes> {
  const cleanedParams: Partial<User.CreationAttributes> = {
    uuid: params.uuid,
  };
  return cleanWhereParams(cleanedParams, CREATION_ATTRIBUTE_NAMES);
}
// through parameter has been added to handle case where include object must not have a through table
// Needed for getMachinesById function for example
function getIncludeOptions(
  includes: User.NestedAssociations[],
  useThrough: boolean = true
): FindOptions {
  if (includes.length === 0) return {};

  return {
    include: includes.map(modelName =>
      useThrough
        ? {
            model: models[modelName],
            through: { attributes: [] },
          }
        : {
            model: models[modelName],
          }
    ),
  };
}

/** CRUD methods *************************************************************************************************** */

function list(
  params: Partial<User.CreationAttributes>,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<User.NestedAssociations>
): Promise<User.Instance[]> {
  const options: FindOptions<User.Attributes> = {
    where: cleanSearchParams(params),
    ...getIncludeOptions(includes),
    transaction,
  };
  return models.user.findAll(options);
}

async function getById(
  id: User.Instance['id'],
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<User.NestedAssociations>
): Promise<User.Instance> {
  const options: FindOptions<User.Attributes> = {
    ...getIncludeOptions(includes),
    transaction,
  };
  const user = await models.user.findByPk(id, options);

  if (!user) throw createHttpError(404, 'User not found');

  return user;
}

async function create(
  params: User.CreationAttributes,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<User.NestedAssociations>
): Promise<User.Instance> {
  const getOptions: CreateOptions<User.Attributes> = getIncludeOptions(includes);

  let user = await models.user.findOne({
    where: cleanSearchParams(params),
    paranoid: false, // to get soft-deleted results too
    transaction,
  });

  if (!user) {
    user = await models.user.create(params, { transaction });
  } else {
    await user.restore({ transaction });
  }

  return user.reload({ ...getOptions, transaction });
}

async function update(
  id: User.Instance['id'],
  params: Partial<User.CreationAttributes>,
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<User.NestedAssociations>
): Promise<User.Instance> {
  const user = await getById(id, { includes, transaction });
  await user.update(params, { transaction });
  return user.reload({ transaction });
}

async function destroy(
  id: User.Instance['id'],
  { transaction }: QueryOptions<User.NestedAssociations>
): Promise<void> {
  const user = await getById(id, { transaction });
  return user.destroy({ transaction });
}

/** Specific methods *********************************************************************************************** */

interface UserMachineWithAssociations extends UsersMachinesAssociation.Instance {
  sessions?: Session.Attributes[];
  machine?: Machine.Instance;
}

async function getMachinesById(
  id: User.Instance['id'],
  { includes = DEFAULT_INCLUDES, transaction }: QueryOptions<User.NestedAssociations>
) {
  // machine association must be included by default
  // this association is not exposed to user as it is the purpose of this service
  const useThrough = false;
  const getOptions = getIncludeOptions(['machine', ...includes], useThrough);

  const userMachines: UserMachineWithAssociations[] = await models.users_machines.findAll({
    where: { userId: id },
    include: getOptions.include,
    transaction,
  });
  // Unfortunately, datas from userMachine must be reorganized to respect route expectation
  // That sessions is an include of machine (include of userMachine in fact)
  return userMachines.map(userMachine => ({
    ...userMachine.machine?.dataValues,
    sessions: userMachine.sessions,
  }));
}

async function linkMachineById(
  userId: User.Instance['id'],
  machineId: Machine.Instance['id'],
  { transaction }: QueryOptions<User.NestedAssociations>
): Promise<void> {
  const user = await getById(userId, { transaction });
  const machine = await getMachineById(machineId, { transaction });
  await user.addMachine(machine, { transaction });
}

async function unlinkMachineById(
  userId: User.Instance['id'],
  machineId: Machine.Instance['id'],
  { transaction }: QueryOptions<User.NestedAssociations>
): Promise<void> {
  const user = await getById(userId, { transaction });
  const machine = await getMachineById(machineId, { transaction });
  await user.removeMachine(machine, { transaction });
}

export type {};

export {
  list,
  getById,
  create,
  update,
  destroy,
  getMachinesById,
  linkMachineById,
  unlinkMachineById,
};

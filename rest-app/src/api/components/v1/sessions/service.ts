import createHttpError from 'http-errors';
import { getUsers, createSession } from '@services/catalog';
import * as iam from '@services/iam';

async function create(userUuid: string, machineId: number, headers: { accessToken: string }) {
  const [user] = await getUsers(userUuid, headers);
  if (!user)
    throw createHttpError(
      500,
      'User has not been synchronized with identity provider. Please try again later'
    );
  const session = await createSession({ userId: user.id, machineId }, headers);
  const { jwt } = await iam.createJWT(
    {
      machineId,
      sessionId: session.id,
      machineExternalIp: session.userMachine.machine.externalIp,
      machineExternalPort: session.userMachine.machine.externalPort,
    },
    headers
  );
  return { session, jwt };
}

export { create };

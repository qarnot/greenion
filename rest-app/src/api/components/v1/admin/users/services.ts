import { IdentityCreateInput } from 'types/iam';
import * as iam from '@services/iam';
import * as catalog from '@services/catalog';

async function createUser(body: IdentityCreateInput, headers: { accessToken: string }) {
  const user = await iam.createUser(body, headers);
  // Id is converted to uuid here as uuid refers to kratos id in api catalog
  await catalog.createUser({ uuid: user.id }, headers);
  return user;
}

export { createUser };

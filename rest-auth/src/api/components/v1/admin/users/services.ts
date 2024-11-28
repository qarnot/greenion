import { IdentityCreateInput } from 'types/iam';
import { identityApi } from '@services/ory';

async function createUser(body: IdentityCreateInput) {
  const createIdentityBody = {
    credentials: {
      password: {
        config: {
          password: body.password,
        },
      },
    },
    traits: {
      email: body.email,
    },
    metadata_public: {
      role: body.role,
    },
    schema_id: 'default',
  };

  const { data } = await identityApi.createIdentity({ createIdentityBody });
  return {
    id: data.id,
    email: data.traits.email,
    metadata_public: data.metadata_public as { role: 'admin' | 'user' },
  };
}

export { createUser };

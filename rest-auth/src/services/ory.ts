import { OAuth2Api, Configuration as HydraConfiguration } from '@ory/hydra-client';
import { FrontendApi, Configuration, IdentityApi } from '@ory/client';
import * as config from '@config';

const oauth2Api = new OAuth2Api(
  new HydraConfiguration({
    basePath: config.hydra.admin.url,
  })
);

const frontendApi = new FrontendApi(
  new Configuration({
    basePath: config.kratos.public.url,
  })
);

const identityApi = new IdentityApi(
  new Configuration({
    basePath: config.kratos.admin.url,
  })
);

export { oauth2Api, frontendApi, identityApi };

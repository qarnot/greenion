import { OidcApi, Configuration, FrontendApi } from '@ory/client';
import { hydra as hydraConfig, kratos as kratosConfig } from '@config';
import { BaseClient, Issuer } from 'openid-client';

const oidcApi = new OidcApi(
  new Configuration({
    basePath: hydraConfig.public.url,
  })
);

const frontendApi = new FrontendApi(
  new Configuration({
    basePath: kratosConfig.public.url,
  })
);

let oauth2Client: BaseClient;
async function getOauth2Client(): Promise<BaseClient> {
  if (oauth2Client) return oauth2Client;
  const hydraIssuer = await Issuer.discover(hydraConfig.public.url);
  oauth2Client = new hydraIssuer.Client({
    client_id: hydraConfig.client.id,
    client_secret: hydraConfig.client.secret,
  });
  return oauth2Client;
}

export { oidcApi, frontendApi, getOauth2Client };

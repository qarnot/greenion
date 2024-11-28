import axios from 'axios';
import * as config from '@config';
import { IdentityCreateInput, IdentityCreateOutput } from 'types/iam';
import { Response } from 'express';
import { makeTokenHex } from '@api/lib/crypto';
import { getOauth2Client } from './ory';

async function createJWT(
  body: {
    machineId: number;
    sessionId: number;
    machineExternalIp: string;
    machineExternalPort: string;
  },
  headers: { accessToken: string }
) {
  const { data } = await axios.post(
    `${config.services.iam.url}/api/v1/token`,
    {
      audience: body.machineId,
      payload: {
        sessionId: body.sessionId,
        machineExternalIp: body.machineExternalIp,
        machineExternalPort: body.machineExternalPort,
      },
    },
    {
      headers: {
        Authorization: headers.accessToken,
      },
    }
  );
  return data;
}

async function createCertificates(
  body: {
    machineId: number;
    machineExternalIp: string;
  },
  headers: {
    accessToken: string;
  }
): Promise<{ privateKey: string; signedCertificate: string }> {
  const { data } = await axios.post(`${config.services.iam.url}/api/v1/certificates`, body, {
    headers: {
      Authorization: headers.accessToken,
    },
  });
  return data;
}
async function getAuthUrl(res: Response) {
  const state = makeTokenHex();
  /* Cookie 'state' is used to prevent cross-site request forgery (csrf)
    This cookie will be used later when rest-app receive authentification response
    from the oauth server. State value must match */
  res.cookie('state', state, {
    httpOnly: true,
  });
  const client = await getOauth2Client();
  const url = client.authorizationUrl({
    redirect_uri: config.hydra.client.redirectCallback,
    scope: 'openid offline email',
    audience: config.hydra.client.requestedAudience,
  });
  return `${url}&state=${state}`;
}

async function createUser(
  body: IdentityCreateInput,
  headers: { accessToken: string }
): Promise<IdentityCreateOutput> {
  const { data } = await axios.post(`${config.services.iam.url}/api/v1/admin/users`, body, {
    headers: {
      Authorization: headers.accessToken,
    },
  });
  return data;
}

export { createJWT, createCertificates, createUser, getAuthUrl };

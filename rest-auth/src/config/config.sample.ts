import { isTrue } from './utils';

const hydra = {
  admin: {
    url: process.env.HYDRA_ADMIN_URL || 'http://172.17.0.1:4445',
  },
  public: {
    url: process.env.HYDRA_PUBLIC_URL || `http://${process.env.DOMAIN || 'greenion.local'}:5004/`,
  },
  jwks: {
    sessionVDI: {
      kid: process.env.HYDRA_JWKS_SESSION_VDI_KID || '',
      alg: process.env.HYDRA_JWKS_SESSION_VDI_ALG || 'RS256',
      expirationTime: process.env.HYDRA_JWKS_SESSION_VDI_EXPIRATION_TIME || '1 day',
    },
    accessToken: {
      name: process.env.HYDRA_JWKS_ACCESS_TOKEN_NAME || 'vdi.session',
      alg: process.env.HYDRA_JWKS_ACCESS_TOKEN_ALG || 'RS256',
      expirationTime: process.env.HYDRA_JWKS_SESSION_VDI_EXPIRATION_TIME || '1 day',
    },
  },
};

const kratos = {
  public: {
    url: process.env.KRATOS_PUBLIC_URL || 'http://172.17.0.1:4433',
  },
  admin: {
    url: process.env.KRATOS_ADMIN_URL || 'http://172.17.0.1:4434',
  },
};

type ServerConfig = {
  port: Number;
  listenOn: string;
  endpoint: string;
};

const server: ServerConfig = {
  port: Number(process.env.LISTEN_PORT) || 4002,
  listenOn: process.env.LISTEN_ON || '127.0.0.1',
  get endpoint() {
    return process.env.SERVER_ENDPOINT || `${server.listenOn}:${server.port}`;
  },
};

const certificates = {
  ca: {
    certificate: process.env.CERTIFICATES_CA_CERTIFICATE || '/opt/greenion/certs/rootCA.crt.pem',
    privateKey: process.env.CERTIFICATES_CA_PRIVATE_KEY || '/opt/greenion/certs/rootCA.key.pem',
  },
  csr: {
    organizationName: process.env.CERTIFICATES_CSR_ORGANIZATION_NAME || 'GREENION',
    countryName: process.env.CERTIFICATES_CSR_COUNTRY_NAME || 'FR',
  },
  output: {
    // NOTE: write generated certificates on disk for debug purposes only, must NOT be true on production environment
    isEnabled: isTrue(process.env.CERTIFICATES_OUTPUT_IS_ENABLED),
    path: process.env.CERTIFICATES_OUTPUT_PATH || '/opt/greenion/certs/output',
  },
};
export { hydra, kratos, server, certificates };

type ServerConfig = {
  port: Number;
  listenOn: string;
  publicAddress: string;
  domain: string;
};

const server: ServerConfig = {
  port: Number(process.env.LISTEN_PORT) || 4001,
  listenOn: process.env.LISTEN_ON || '127.0.0.1',
  domain: process.env.DOMAIN || 'greenion.local',
  publicAddress: `http://${process.env.DOMAIN || 'greenion.local'}`,
};

const hydra = {
  admin: {
    url: process.env.HYDRA_ADMIN_URL || 'http://172.17.0.1:4445',
  },
  public: {
    url: process.env.HYDRA_PUBLIC_URL || `${server.publicAddress}:5004/`,
  },
  jwks: {
    accessToken: {
      audience: process.env.HYDRA_JWKS_ACCESS_TOKEN_AUDIENCE || 'rest-app',
      alg: process.env.HYDRA_JWKS_ACCESS_TOKEN_ALG || 'RS256',
    },
  },
  client: {
    name: process.env.HYDRA_CLIENT_NAME || 'rest-app',
    id: process.env.HYDRA_CLIENT_ID || '',
    secret: process.env.HYDRA_CLIENT_SECRET || '',
    redirectCallback:
      process.env.HYDRA_CLIENT_REDIRECT_CALLBACK || `${server.publicAddress}:5001/callback`,
    requestedAudience: process.env.HYDRA_CLIENT_REQUESTED_AUDIENCE || 'rest-app rest-catalog',
  },
};

const kratos = {
  public: {
    url: process.env.KRATOS_PUBLIC_URL || 'http://172.17.0.1:4433',
  },
};

type AuthorizationConfig = {
  cookie: {
    name: string;
    secret: string;
  };
};

const authorization: AuthorizationConfig = {
  cookie: {
    name: process.env.AUTHORIZATION_COOKIE_NAME || 'webapp_session',
    secret: process.env.AUTHORIZATION_COOKIE_SECRET || 'secret',
  },
};

const services = {
  catalog: {
    url: process.env.SERVICES_CATALOG_URL || 'http://172.17.0.1:5003',
  },
  iam: {
    url: process.env.SERVICES_IAM_URL || 'http://172.17.0.1:5002',
  },
};

export { hydra, kratos, server, authorization, services };

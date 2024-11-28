import { Config } from 'types/config';

import { isTrue, getMigrationState } from './utils';

const hydra = {
  public: {
    url: process.env.HYDRA__PUBLIC_URL || `http://${process.env.DOMAIN || 'greenion.local'}:5004/`,
  },
  jwks: {
    accessToken: {
      audience: process.env.HYDRA_JWKS_ACCESS_TOKEN_AUDIENCE || 'rest-catalog',
      alg: process.env.HYDRA_JWKS_ACCESS_TOKEN_ALG || 'RS256',
    },
    sessionVDI: {
      kid: process.env.HYDRA_JWKS_SESSION_VDI_KID || '',
    },
  },
};

const server: Config['server'] = {
  port: Number(process.env.LISTEN_PORT) || 4003,
  listenOn: process.env.LISTEN_ON || '127.0.0.1',
};

const authorization: Config['authorization'] = {
  // This cookie must have the same value as in rest-app
  // because cookie set in rest-app can be used as auth
  cookie: {
    name: process.env.AUTHORIZATION_COOKIE_NAME || 'webapp_session',
    secret: process.env.AUTHORIZATION_COOKIE_SECRET || 'secret',
  },
};

const database: Config['database'] = {
  username: process.env.DB_USERNAME || 'catalog',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'catalog',
  host: process.env.DB_HOST || '172.17.0.1',
  port: Number(process.env.DB_PORT) || 3307,
  dialect: 'mysql', // hardcoded on purpose, we are only supporting `mysql` dialect for the moment
  seederStorage: process.env.DB_SEED_STORAGE || 'sequelize',
  logging: isTrue(process.env.DB_LOGGING),
};

const sequelize: Config['sequelize'] = {
  migrations: getMigrationState(process.env.SEQUELIZE_MIGRATIONS),
  seeds: getMigrationState(process.env.SEQUELIZE_SEEDS),
};

const services = {
  iam: {
    url: process.env.IAM_URL || '127.0.0.1:4002',
  },
};

export { server, hydra, database, sequelize, authorization, services };

type ServerConfig = {
  port: number;
  listenOn: string;
};

type AuthorizationConfig = {
  cookie: {
    name: string;
    secret: string;
  };
};

type DatabaseConfig = {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: 'mysql';
  seederStorage: string;
  logging: boolean;
};

type MigrationState = 'up' | 'down' | 'none';

type SequelizeConfig = {
  migrations: MigrationState;
  seeds: MigrationState;
};

type Config = {
  server: ServerConfig;
  database: DatabaseConfig;
  sequelize: SequelizeConfig;
  authorization: AuthorizationConfig;
};

export type { Config };

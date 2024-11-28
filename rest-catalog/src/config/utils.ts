import type { Config } from 'types/config';

function isTrue(envVarValue: string | undefined): boolean {
  const Booleans = ['1', 'true', 'True', 'TRUE', 1, true];
  return envVarValue !== undefined && Booleans.includes(envVarValue);
}

function getMigrationState(envVarValue: string | undefined): Config['sequelize']['migrations'] {
  if (envVarValue !== 'up' && envVarValue !== 'down' && envVarValue !== 'none') return 'none';
  return envVarValue;
}

export { isTrue, getMigrationState };

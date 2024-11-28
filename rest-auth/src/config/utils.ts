function isTrue(envVarValue: string | undefined): boolean {
  const Booleans = ['1', 'true', 'True', 'TRUE', 1, true];
  return envVarValue !== undefined && Booleans.includes(envVarValue);
}

export { isTrue };

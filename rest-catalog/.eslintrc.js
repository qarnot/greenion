const config = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname, // <-- this did the trick for me
    ecmaVersion: 6,
    project: 'tsconfig.json',
  },
  plugins: ['import', '@typescript-eslint', 'jest'],
  extends: ['airbnb-base', 'airbnb-typescript/base', 'prettier', 'plugin:jest/all'],
  env: {
    es6: true,
    'jest/globals': true,
  },
  overrides: [
    {
      // disabling 'import/first' rule because jest mocks need to be applied before related import
      // disabling 'jest/prefer-lowercase-title' rule because we want to name our tests like we want!
      files: ['*.spec.ts', '*.test.ts'],
      rules: {
        'import/first': 'off',
        'jest/prefer-lowercase-title': 'off',
      },
    },
  ],
  rules: {
    'no-console': 'off',
    'jest/max-expects': 'off',
    'import/prefer-default-export': 'off',
    'jest/no-hooks': 'off',
    'jest/require-hook': 'off',
  },
  reportUnusedDisableDirectives: true,
  ignorePatterns: [
    'schema.d.ts',
    '.eslintrc.js',
    'jest.config.js',
    'husky.config.js',
    'lint-staged.config.js',
    'prettier.config.js',
    'register-alias.js',
    'node_modules/',
    'doc/',
    'coverage/',
    'build/',
    'dist/',
  ],
};

module.exports = config;

module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },

  extends: ['plugin:vue/recommended', 'airbnb-base', '@vue/eslint-config-typescript'],

  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },

  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2018,
    sourceType: 'module',
  },

  plugins: ['vue'],

  rules: {
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'import/extensions': 'off',
    // disable import that can't be resolved, like import api from 'api'
    'import/no-unresolved': 'off',
    // ----- VUE -----
    // closing bracket on the same line of the last attribute
    'vue/html-closing-bracket-newline': [
      'error',
      {
        singleline: 'never',
        multiline: 'never',
      },
    ],
    // force name property in component
    'vue/require-name-property': ['error'],
    'vue/no-v-model-argument': 'off',
    'import/prefer-default-export': 'off',
  },
};

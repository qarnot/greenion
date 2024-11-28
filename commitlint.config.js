const { packages = [] } = require('./lerna.json');
const allowedScopes = ['greenion', ...packages];
// regexp to match release tags created thanks to `deploy.bash` script
// examples: `rest-iam-v0.1.0`, `rest-iam-v0.1.0-alpha.1`, `rest-iam-v3.1.0-beta.2` etc...
const newVersionCommitPattern = new RegExp(`(${packages.join('|')})-v\\d+\\.\\d+\\.\\d+.*`)
module.exports = {
  extends: ['@commitlint/config-conventional'],
  // ignore version commit
  ignores: [commit => newVersionCommitPattern.test(commit)],
  rules: {
    // commit message should always include a scope with value from allowedScopes
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', allowedScopes],
  },
};

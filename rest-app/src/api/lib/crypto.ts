import crypto from 'crypto';

function makeTokenHex() {
  return crypto.randomBytes(64).toString('hex');
}

export { makeTokenHex };

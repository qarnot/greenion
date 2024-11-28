import * as jose from 'jose';
import * as config from '@config';

async function getPublicKey(kid: string) {
  const JWKS = jose.createRemoteJWKSet(new URL(`${config.hydra.public.url}/.well-known/jwks.json`));
  return JWKS({
    kid,
    alg: config.hydra.jwks.accessToken.alg,
  });
}

async function verify(
  token: string | Uint8Array,
  publicKey: jose.KeyLike | Uint8Array,
  options: jose.VerifyOptions = {}
) {
  const localOptions = {
    ...options,
    issuer: config.hydra.public.url,
    audience: config.hydra.jwks.accessToken.audience,
  };
  return jose.jwtVerify(token, publicKey, localOptions);
}

async function verifyVdiJWT(
  token: string | Uint8Array,
  publicKey: jose.KeyLike | Uint8Array,
  options: jose.VerifyOptions = {}
) {
  const localOptions = {
    ...options,
    issuer: config.services.iam.url,
  };
  return jose.jwtVerify(token, publicKey, localOptions);
}

function getHeader(token: string) {
  return jose.decodeProtectedHeader(token);
}

export { getPublicKey, verify, getHeader, verifyVdiJWT };

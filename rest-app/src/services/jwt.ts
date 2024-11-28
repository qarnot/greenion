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
    audience: config.hydra.client.name,
  };
  return jose.jwtVerify(token, publicKey, localOptions);
}

function getHeader(token: string) {
  return jose.decodeProtectedHeader(token);
}
function decode<T>(token: string) {
  return jose.decodeJwt<T>(token);
}

export { getPublicKey, getHeader, verify, decode };

import * as jose from 'jose';
import * as config from '@config';

import jwks from '../config/jwks.json';

function getSessionVDIJWK() {
  const sessionJwk = jwks?.keys?.find(
    (jwk: { kid: string }) => jwk.kid === config.hydra.jwks.sessionVDI.kid
  );
  if (!sessionJwk) {
    throw Error('Missing jwk for vdi session');
  }
  return sessionJwk;
}

async function generateToken(
  sub: string,
  audience: string,
  payload: { sessionId: number; machineExternalIp: string; machineExternalPort: number }
) {
  const jwk = getSessionVDIJWK();
  const JWK = await jose.importJWK(jwk, config.hydra.jwks.sessionVDI.alg);
  return new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: config.hydra.jwks.sessionVDI.alg,
      kid: config.hydra.jwks.sessionVDI.kid,
    })
    .setIssuer(config.server.endpoint)
    .setAudience(audience)
    .setSubject(sub)
    .setExpirationTime(config.hydra.jwks.sessionVDI.expirationTime)
    .sign(JWK);
}

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
  };
  return jose.jwtVerify(token, publicKey, localOptions);
}

function getHeader(token: string) {
  return jose.decodeProtectedHeader(token);
}

export { generateToken, verify, getPublicKey, getHeader };

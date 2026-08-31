import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';

const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  { timeoutDuration: 15000 }
);
const ISSUER = `${env.SUPABASE_URL}/auth/v1`;

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: 'authenticated',
  });

  return {
    id: payload.sub,
    email: payload.email,
  };
}
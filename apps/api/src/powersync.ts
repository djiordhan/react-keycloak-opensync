import fs from 'fs';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';

const PRIVATE_KEY = fs.readFileSync(process.env.POWERSYNC_PRIVATE_KEY_PATH!, 'utf8');
const PUBLIC_KEY_PATH = process.env.POWERSYNC_PRIVATE_KEY_PATH!.replace('private.key', 'public.key');
const PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

export const KID = 'powersync-key-1';

export const generatePowerSyncToken = (user: any) => {
  const tenantId = user.tenantId || user.sub; // Fallback or strict

  const payload = {
    sub: user.sub,
    tenantId: tenantId,
    parameters: {
      tenantId: tenantId
    }
  };

  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: '1h',
    audience: process.env.POWERSYNC_AUDIENCE,
    issuer: 'demo-api',
    keyid: KID
  });
};

export const getJwks = () => {
  const key = createPublicKey(PUBLIC_KEY);
  const jwk = key.export({ format: 'jwk' }) as any;
  jwk.kid = KID;
  jwk.use = 'sig';
  jwk.alg = 'RS256';
  
  return {
    keys: [jwk]
  };
};

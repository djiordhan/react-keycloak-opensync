import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const client = jwksRsa({
  jwksUri: process.env.KEYCLOAK_JWKS_URI!,
  cache: true,
  rateLimit: true,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided');

  jwt.verify(token, getKey, {
    issuer: process.env.KEYCLOAK_ISSUER,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).send('Invalid token');
    }
    (req as any).user = decoded;
    next();
  });
};

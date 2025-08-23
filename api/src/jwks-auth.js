// Supabase AuthのJWT検証用ユーティリティ
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';


export function createSupabaseJwtVerifier(SUPABASE_URL) {
  const SUPABASE_JWKS_URL = `${SUPABASE_URL}/auth/v1/keys`;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const client = jwksClient({
    jwksUri: SUPABASE_JWKS_URL,
    requestHeaders: {
      apikey: SUPABASE_ANON_KEY,
    },
  });

  function getKey(header, callback) {
    client.getSigningKey(header.kid, function (err, key) {
      if (err) {
        callback(err);
      } else {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      }
    });
  }

  return function verify(token, callback) {
    jwt.verify(token, getKey, {}, callback);
  };
}

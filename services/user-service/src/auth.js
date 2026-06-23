import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'dev_shared_secret';

// "access_token" je JWT (HS256) - drugi servisi ga validiraju istim SECRET-om.
export function issueToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    SECRET, { expiresIn: '12h' });
}
export function verifyToken(token) { return jwt.verify(token, SECRET); }

// Express middleware (Sanctum-stil: Authorization: Bearer <token>)
export function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = verifyToken(token); next(); }
  catch { return res.status(401).json({ error: 'Unauthorized' }); }
}

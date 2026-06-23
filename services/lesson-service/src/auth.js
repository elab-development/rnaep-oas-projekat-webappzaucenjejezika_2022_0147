import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'dev_shared_secret';
export function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { return res.status(401).json({ error: 'Unauthorized' }); }
}
export const isAdmin = (u) => u?.role === 'admin';

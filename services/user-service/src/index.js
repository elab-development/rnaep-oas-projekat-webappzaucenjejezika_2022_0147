import express from 'express';
import bcrypt from 'bcryptjs';
import { pool, initDb } from './db.js';
import { issueToken, authRequired } from './auth.js';
import { securityHeaders, corsAllowlist, sanitizeBody } from './security.js';
import { metricsMiddleware, mountMetrics } from './metrics.js';

const app = express();
app.use(securityHeaders());
app.use(corsAllowlist());
app.use(metricsMiddleware);
app.use(express.json());
app.use(sanitizeBody);

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

app.get('/health', (_q, r) => r.json({ status: 'ok', service: 'user-service' }));
mountMetrics(app);

// --- AuthController ---
// POST /api/register  -> { data, access_token, token_type }
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const errors = {};
  if (!name) errors.name = ['The name field is required.'];
  if (!email || !/^\S+@\S+/.test(email)) errors.email = ['The email field must be valid.'];
  if (!password || String(password).length < 8) errors.password = ['The password must be at least 8 characters.'];
  if (Object.keys(errors).length) return res.status(422).json(errors);

  const exists = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (exists.rowCount) return res.status(422).json({ email: ['The email has already been taken.'] });

  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    "INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,'student') RETURNING id,name,email,role",
    [name, email, hash]);
  const user = rows[0];
  res.json({ data: publicUser(user), access_token: issueToken(user), token_type: 'Bearer' });
});

// POST /api/login -> { message, access_token, token_type }
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password || '', user.password))
    return res.status(401).json({ message: 'WRONG INPUT' });
  res.json({ message: `${user.name} logged in`, access_token: issueToken(user), token_type: 'Bearer' });
});

// GET /api/me -> { data }
app.get('/api/me', authRequired, async (req, res) => {
  const { rows } = await pool.query('SELECT id,name,email,role FROM users WHERE id=$1', [req.user.sub]);
  if (!rows[0]) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ data: rows[0] });
});

// POST /api/logout -> { message }  (stateless JWT: klijent brise token)
app.post('/api/logout', authRequired, (_req, res) =>
  res.json({ message: 'You have successfully logged out.' }));

// --- Interni endpointi (interna mreza; koriste ih course/lesson servisi) ---
app.get('/internal/users/stats', async (_q, res) => {
  const total = await pool.query('SELECT count(*)::int AS n FROM users');
  const byRole = await pool.query(
    "SELECT role, count(*)::int AS count FROM users GROUP BY role ORDER BY role");
  res.json({ users_total: total.rows[0].n, users_by_role: byRole.rows });
});
app.get('/internal/users', async (req, res) => {
  const ids = String(req.query.ids || '').split(',').map(x => parseInt(x, 10)).filter(Boolean);
  if (!ids.length) return res.json([]);
  const { rows } = await pool.query(
    'SELECT id,name,email,role FROM users WHERE id = ANY($1::int[])', [ids]);
  res.json(rows);
});
app.get('/internal/users/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT id,name,email,role FROM users WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'not found' });
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3001;
initDb()
  .then(() => app.listen(PORT, () => console.log(`[user-service] :${PORT}`)))
  .catch(err => { console.error('DB init greska:', err); process.exit(1); });

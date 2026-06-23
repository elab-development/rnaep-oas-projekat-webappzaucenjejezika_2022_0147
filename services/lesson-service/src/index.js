import express from 'express';
import { pool, initDb, seedFromCourses } from './db.js';
import { authRequired, isAdmin } from './auth.js';
import { DictionaryClient, TranslateClient } from './externalClients.js';
import { securityHeaders, corsAllowlist, sanitizeBody } from './security.js';
import { metricsMiddleware, mountMetrics } from './metrics.js';

const app = express();
app.use(securityHeaders());
app.use(corsAllowlist());
app.use(metricsMiddleware);
app.use(express.json());
app.use(sanitizeBody);
app.get('/health', (_q, r) => r.json({ status: 'ok', service: 'lesson-service' }));
mountMetrics(app);

const USER = process.env.USER_SERVICE_URL || 'http://user-service:3001';
async function teacherNames(ids) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  try { const r = await fetch(`${USER}/internal/users?ids=${uniq.join(',')}`);
    const arr = await r.json(); return Object.fromEntries(arr.map(u => [u.id, u])); }
  catch { return {}; }
}
const lessonRes = (l, names = {}) => ({
  id: l.id, course_id: l.course_id, teacher_id: l.teacher_id, title: l.title,
  starts_at: l.starts_at, ends_at: l.ends_at,
  teacher: { id: l.teacher_id, name: names[l.teacher_id]?.name || null }
});

// ===================== LESSONS =====================
app.get('/api/lessons', authRequired, async (req, res) => {
  const { search, teacher_id, course_id } = req.query;
  const sortCol = ['starts_at', 'title', 'id'].includes(req.query.sort_by) ? req.query.sort_by : 'starts_at';
  const sortDir = String(req.query.sort_dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const per_page = Math.min(parseInt(req.query.per_page, 10) || 50, 200);
  const cond = []; const params = [];
  if (course_id) { params.push(course_id); cond.push(`course_id=$${params.length}`); }
  if (teacher_id) { params.push(teacher_id); cond.push(`teacher_id=$${params.length}`); }
  if (search) { params.push(`%${search}%`); cond.push(`title ILIKE $${params.length}`); }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT * FROM lessons ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ${per_page}`, params);
  const names = await teacherNames(rows.map(r => r.teacher_id));
  res.json({ lessons: rows.map(l => lessonRes(l, names)) });
});
app.get('/api/lessons/:id', authRequired, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const names = await teacherNames([rows[0].teacher_id]);
  res.json({ lesson: lessonRes(rows[0], names) });
});
app.post('/api/lessons', authRequired, async (req, res) => {
  if (req.user.role !== 'teacher' && !isAdmin(req.user))
    return res.status(403).json({ error: 'Only teachers can create lessons' });
  const { course_id, title, starts_at, ends_at } = req.body || {};
  if (!course_id || !title || !starts_at)
    return res.status(422).json({ error: 'course_id, title, starts_at are required' });
  const { rows } = await pool.query(
    'INSERT INTO lessons(course_id,teacher_id,title,starts_at,ends_at) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [course_id, req.user.sub, title, starts_at, ends_at || null]);
  const names = await teacherNames([rows[0].teacher_id]);
  res.json({ lesson: lessonRes(rows[0], names) });
});
app.put('/api/lessons/:id', authRequired, async (req, res) => {
  const cur = await pool.query('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
  if (!cur.rows[0]) return res.status(404).json({ error: 'Not found' });
  if (!isAdmin(req.user) && cur.rows[0].teacher_id !== req.user.sub)
    return res.status(403).json({ error: 'Forbidden' });
  const { title, starts_at, ends_at, course_id } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE lessons SET title=COALESCE($1,title), starts_at=COALESCE($2,starts_at),
       ends_at=COALESCE($3,ends_at), course_id=COALESCE($4,course_id), updated_at=now()
     WHERE id=$5 RETURNING *`,
    [title ?? null, starts_at ?? null, ends_at ?? null, course_id ?? null, req.params.id]);
  const names = await teacherNames([rows[0].teacher_id]);
  res.json({ lesson: lessonRes(rows[0], names) });
});
app.delete('/api/lessons/:id', authRequired, async (req, res) => {
  const cur = await pool.query('SELECT * FROM lessons WHERE id=$1', [req.params.id]);
  if (!cur.rows[0]) return res.status(404).json({ error: 'Not found' });
  if (!isAdmin(req.user) && cur.rows[0].teacher_id !== req.user.sub)
    return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM lessons WHERE id=$1', [req.params.id]);
  res.json({ message: 'deleted' });
});

// ===================== TRANSLATE (eksterni API: LibreTranslate) =====================
app.get('/api/translate', authRequired, async (req, res) => {
  const { q, source, target } = req.query;
  if (!q || !source || !target)
    return res.status(422).json({ error: 'q, source, target are required' });
  try { res.json(await TranslateClient.translate(q, source, target)); }
  catch (e) {
    if (e.code === 422)
      return res.status(422).json({ error: 'Use ISO-2 codes (en, de, fr...) or names (English...)' });
    res.status(502).json({ error: 'Translation service not reachable' });
  }
});

// ===================== DICTIONARY (eksterni API: Free Dictionary) =====================
app.get('/api/dictionary/:word', async (req, res) => {
  try { res.json(await DictionaryClient.lookup(req.params.word, req.query.lang)); }
  catch { res.status(502).json({ error: 'Dictionary API nedostupan ili rec nije pronadjena' }); }
});

// ===================== INTERNI STATS (za course-service admin) =====================
app.get('/internal/lessons/stats', async (_q, res) => {
  const total = await pool.query('SELECT count(*)::int n FROM lessons');
  const perMonth = await pool.query(
    `SELECT to_char(starts_at,'YYYY-MM') AS label, count(*)::int AS value
     FROM lessons WHERE starts_at IS NOT NULL
     GROUP BY label ORDER BY label LIMIT 6`);
  res.json({ lessons_total: total.rows[0].n, lessons_per_month: perMonth.rows });
});

const PORT = process.env.PORT || 3003;
initDb()
  .then(() => app.listen(PORT, () => console.log(`[lesson-service] :${PORT}`)))
  .then(() => seedFromCourses())
  .catch(e => { console.error(e); process.exit(1); });

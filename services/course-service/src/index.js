import express from 'express';
import cors from 'cors';
import { pool, initDb } from './db.js';
import { authRequired, isAdmin } from './auth.js';
import { UserClient, LessonClient, connectBroker, publish } from './clients.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_q, r) => r.json({ status: 'ok', service: 'course-service' }));

// ---------- mapiranja (isti oblik kao Laravel Resource klase) ----------
const langRes = (l) => l && ({ id: l.id, name: l.name, imgUrl: l.img_url });
const courseRes = (c) => ({
  id: c.id, title: c.title, language_id: c.language_id,
  ...(c.l_id ? { language: { id: c.l_id, name: c.l_name, imgUrl: c.l_img } } : {}),
  level: c.level, teacher_id: c.teacher_id, is_active: !!c.is_active
});
const SELECT_COURSE = `
  SELECT c.*, l.id AS l_id, l.name AS l_name, l.img_url AS l_img
  FROM courses c LEFT JOIN languages l ON l.id = c.language_id`;

// ===================== LANGUAGES =====================
app.get('/api/languages', async (_q, res) => {
  const { rows } = await pool.query('SELECT * FROM languages ORDER BY name');
  res.json({ languages: rows.map(langRes) });
});
app.get('/api/languages/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM languages WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ language: langRes(rows[0]) });
});
app.post('/api/languages', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });
  const { name, imgUrl } = req.body || {};
  if (!name) return res.status(422).json({ name: ['The name field is required.'] });
  const { rows } = await pool.query(
    'INSERT INTO languages(name,img_url) VALUES($1,$2) RETURNING *', [name, imgUrl || null]);
  res.json({ language: langRes(rows[0]) });
});
app.put('/api/languages/:id', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });
  const { name, imgUrl } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE languages SET name=COALESCE($1,name), img_url=COALESCE($2,img_url), updated_at=now()
     WHERE id=$3 RETURNING *`, [name ?? null, imgUrl ?? null, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ language: langRes(rows[0]) });
});
app.delete('/api/languages/:id', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });
  await pool.query('DELETE FROM languages WHERE id=$1', [req.params.id]);
  res.json({ message: 'deleted' });
});

// ===================== COURSES =====================
app.get('/api/courses', async (_q, res) => {
  const { rows } = await pool.query(`${SELECT_COURSE} ORDER BY c.is_active DESC, c.title`);
  res.json({ courses: rows.map(courseRes) });
});
app.get('/api/courses/:id', async (req, res) => {
  const { rows } = await pool.query(`${SELECT_COURSE} WHERE c.id=$1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ course: courseRes(rows[0]) });
});
app.get('/api/teacher/:id/courses', authRequired, async (req, res) => {
  const tid = parseInt(req.params.id, 10);
  if (!isAdmin(req.user) && req.user.sub !== tid)
    return res.status(403).json({ error: 'Forbidden' });
  const teacher = await UserClient.one(tid);
  const { rows } = await pool.query(`${SELECT_COURSE} WHERE c.teacher_id=$1 ORDER BY c.title`, [tid]);
  res.json({ teacher, courses: rows.map(courseRes) });
});
app.post('/api/courses', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });
  const { title, language_id, level, teacher_id, is_active = true } = req.body || {};
  if (!title || !level) return res.status(422).json({ error: 'title and level are required' });
  const { rows } = await pool.query(
    'INSERT INTO courses(title,language_id,level,teacher_id,is_active) VALUES($1,$2,$3,$4,$5) RETURNING id',
    [title, language_id || null, level, teacher_id || null, !!is_active]);
  const full = await pool.query(`${SELECT_COURSE} WHERE c.id=$1`, [rows[0].id]);
  res.json({ course: courseRes(full.rows[0]) });
});
app.put('/api/courses/:id', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });
  const { title, language_id, level, teacher_id, is_active } = req.body || {};
  const upd = await pool.query(
    `UPDATE courses SET title=COALESCE($1,title), language_id=COALESCE($2,language_id),
       level=COALESCE($3,level), teacher_id=COALESCE($4,teacher_id),
       is_active=COALESCE($5,is_active), updated_at=now() WHERE id=$6 RETURNING id`,
    [title ?? null, language_id ?? null, level ?? null, teacher_id ?? null,
     (is_active === undefined ? null : !!is_active), req.params.id]);
  if (!upd.rows[0]) return res.status(404).json({ error: 'Not found' });
  const full = await pool.query(`${SELECT_COURSE} WHERE c.id=$1`, [req.params.id]);
  res.json({ course: courseRes(full.rows[0]) });
});
app.delete('/api/courses/:id', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });
  await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
  res.json({ message: 'deleted' });
});

// ===================== ENROLLMENTS =====================
async function enrollmentRows(where = '', params = [], limit = 200) {
  const { rows } = await pool.query(
    `SELECT e.*, c.title AS course_title FROM enrollments e
     JOIN courses c ON c.id = e.course_id ${where}
     ORDER BY e.id DESC LIMIT ${limit}`, params);
  const names = await UserClient.byIds(rows.map(r => r.student_id));
  return rows.map(e => ({
    id: e.id, course_id: e.course_id, student_id: e.student_id, status: e.status,
    course_title: e.course_title, student_name: names[e.student_id]?.name || null
  }));
}
app.get('/api/enrollments', authRequired, async (req, res) => {
  const { course_id, student_id, search } = req.query;
  let status = req.query['status'] ?? req.query['status[]'];
  if (status && !Array.isArray(status)) status = [status];
  const per_page = Math.min(parseInt(req.query.per_page, 10) || 50, 200);
  const cond = []; const params = [];
  if (course_id) { params.push(course_id); cond.push(`e.course_id=$${params.length}`); }
  if (student_id) { params.push(student_id); cond.push(`e.student_id=$${params.length}`); }
  if (status && status.length) { params.push(status); cond.push(`e.status = ANY($${params.length}::text[])`); }
  if (search) { params.push(`%${search}%`); cond.push(`c.title ILIKE $${params.length}`); }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  res.json({ enrollments: await enrollmentRows(where, params, per_page) });
});
app.post('/api/enrollments', authRequired, async (req, res) => {
  const { course_id } = req.body || {};
  if (!course_id) return res.status(422).json({ course_id: ['The course_id field is required.'] });
  const student_id = req.user.sub;
  try {
    const { rows } = await pool.query(
      "INSERT INTO enrollments(course_id,student_id,status) VALUES($1,$2,'active') RETURNING id",
      [course_id, student_id]);
    const [enr] = await enrollmentRows('WHERE e.id=$1', [rows[0].id], 1);
    publish('enrollment.created', { type: 'EnrollmentCreated', ...enr });
    res.json({ enrollment: enr });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Already enrolled' });
    res.status(500).json({ error: 'Greska' });
  }
});
app.put('/api/enrollments/:id', authRequired, async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(422).json({ status: ['The status field is required.'] });
  const cur = await pool.query(
    `SELECT e.*, c.teacher_id FROM enrollments e JOIN courses c ON c.id=e.course_id WHERE e.id=$1`,
    [req.params.id]);
  if (!cur.rows[0]) return res.status(404).json({ error: 'Not found' });
  if (!isAdmin(req.user) && cur.rows[0].teacher_id !== req.user.sub)
    return res.status(403).json({ error: 'Forbidden' });
  await pool.query('UPDATE enrollments SET status=$1, updated_at=now() WHERE id=$2', [status, req.params.id]);
  const [enr] = await enrollmentRows('WHERE e.id=$1', [req.params.id], 1);
  publish('enrollment.updated', { type: 'EnrollmentUpdated', ...enr });
  res.json({ enrollment: enr });
});
app.get('/api/student/:id/enrollments', authRequired, async (req, res) => {
  const sid = parseInt(req.params.id, 10);
  if (!isAdmin(req.user) && req.user.sub !== sid) return res.status(403).json({ error: 'Forbidden' });
  const student = await UserClient.one(sid);
  res.json({ student, enrollments: await enrollmentRows('WHERE e.student_id=$1', [sid]) });
});

// ===================== ADMIN STATS =====================
app.get('/api/admin/stats', authRequired, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Only admins can access this resource' });

  const lv = (q) => q.then(r => r.rows.map(x => ({ label: x.label, value: parseInt(x.value, 10) })));
  const [userStats, lessonStats] = await Promise.all([UserClient.stats(), LessonClient.stats()]);

  const languages = (await pool.query('SELECT count(*)::int n FROM languages')).rows[0].n;
  const courses = (await pool.query('SELECT count(*)::int n FROM courses')).rows[0].n;
  const enrollments = (await pool.query('SELECT count(*)::int n FROM enrollments')).rows[0].n;

  const courses_by_language = await lv(pool.query(
    `SELECT l.name AS label, COUNT(c.id) AS value FROM courses c
     JOIN languages l ON l.id=c.language_id GROUP BY l.name ORDER BY value DESC`));
  const courses_by_level = await lv(pool.query(
    `SELECT level AS label, COUNT(id) AS value FROM courses GROUP BY level ORDER BY level`));
  const enrollments_by_status = await lv(pool.query(
    `SELECT status AS label, COUNT(id) AS value FROM enrollments GROUP BY status ORDER BY value DESC`));
  const top_courses_by_enrollments = await lv(pool.query(
    `SELECT c.title AS label, COUNT(e.id) AS value FROM enrollments e
     JOIN courses c ON c.id=e.course_id GROUP BY c.title ORDER BY value DESC LIMIT 5`));

  // top teacheri po aktivnim kursevima -> imena iz user-service
  const tt = await pool.query(
    `SELECT teacher_id, COUNT(id) AS value FROM courses
     WHERE is_active=true AND teacher_id IS NOT NULL
     GROUP BY teacher_id ORDER BY value DESC LIMIT 5`);
  const tnames = await UserClient.byIds(tt.rows.map(r => r.teacher_id));
  const top_teachers_by_active_courses = tt.rows.map(r => ({
    label: tnames[r.teacher_id]?.name || `#${r.teacher_id}`, value: parseInt(r.value, 10)
  }));

  res.json({
    kpis: {
      users_total: userStats.users_total || 0,
      languages, courses,
      lessons: lessonStats.lessons_total || 0,
      enrollments
    },
    users_by_role: userStats.users_by_role || [],
    courses_by_language, courses_by_level, enrollments_by_status,
    top_teachers_by_active_courses, top_courses_by_enrollments,
    lessons_per_month: lessonStats.lessons_per_month || []
  });
});

const PORT = process.env.PORT || 3002;
initDb()
  .then(connectBroker)
  .then(() => app.listen(PORT, () => console.log(`[course-service] :${PORT}`)))
  .catch(e => { console.error(e); process.exit(1); });

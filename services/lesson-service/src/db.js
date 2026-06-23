import pkg from 'pg'; const { Pool } = pkg;
export const pool = new Pool({
  host: process.env.DB_HOST || 'lesson-db', port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lesson_db'
});
const COURSE = process.env.COURSE_SERVICE_URL || 'http://course-service:3002';

const PLAN = [
  'Unit 1: Alphabet & Pronunciation', 'Unit 2: Greetings & Introductions',
  'Unit 3: Numbers, Time & Dates', 'Unit 4: Family & People',
  'Unit 5: Food & Drinks', 'Unit 6: Around Town (Directions)',
  'Unit 7: Everyday Verbs', 'Unit 8: Shopping & Prices',
  'Unit 9: Weather & Seasons', 'Unit 10: Review & Mini Quiz'
];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      course_id INT NOT NULL,
      teacher_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
  `);
}

// Seed lekcija na osnovu stvarnih kurseva iz course-service (cekamo da se seed-uju).
export async function seedFromCourses(retries = 15) {
  const have = await pool.query('SELECT count(*)::int n FROM lessons');
  if (have.rows[0].n > 0) return;
  let courses = [];
  while (retries--) {
    try {
      const r = await fetch(`${COURSE}/api/courses`);
      const j = await r.json();
      courses = j.courses || [];
      if (courses.length) break;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 4000));
  }
  for (const c of courses) {
    if (!c.teacher_id) continue;
    const n = c.level === 'A1' ? 10 : c.level === 'A2' ? 8 : 6;
    let base = new Date(); base.setDate(base.getDate() + rnd(3, 14));
    for (let i = 0; i < n; i++) {
      const start = new Date(base); start.setDate(start.getDate() + i * rnd(2, 4));
      start.setHours(rnd(9, 19), [0, 30][rnd(0, 1)], 0, 0);
      const end = new Date(start); end.setMinutes(end.getMinutes() + [60, 90][rnd(0, 1)]);
      await pool.query(
        'INSERT INTO lessons(course_id,teacher_id,title,starts_at,ends_at) VALUES($1,$2,$3,$4,$5)',
        [c.id, c.teacher_id, PLAN[i] || `Unit ${i + 1}`, start.toISOString(), end.toISOString()]);
    }
  }
  console.log(`[lesson-service] seed lekcija za ${courses.length} kurseva`);
}

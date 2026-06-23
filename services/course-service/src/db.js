import pkg from 'pg';
const { Pool } = pkg;
export const pool = new Pool({
  host: process.env.DB_HOST || 'course-db', port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'course_db'
});

// teacher_id (2,3,4) i student_id (5..17) referenciraju korisnike iz user-service seed-a.
const TEACHERS = [2, 3, 4];
const STUDENTS = Array.from({ length: 13 }, (_, i) => 5 + i); // 5..17
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS languages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) UNIQUE NOT NULL,
      img_url VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      language_id INT REFERENCES languages(id) ON DELETE SET NULL,
      level VARCHAR(20) NOT NULL,
      teacher_id INT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      course_id INT REFERENCES courses(id) ON DELETE CASCADE,
      student_id INT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (course_id, student_id));
  `);

  const c = await pool.query('SELECT count(*)::int AS n FROM languages');
  if (c.rows[0].n === 0) {
    const langs = [
      ['English', 'https://flagcdn.com/w80/gb.png'],
      ['German',  'https://flagcdn.com/w80/de.png'],
      ['Spanish', 'https://flagcdn.com/w80/es.png'],
      ['French',  'https://flagcdn.com/w80/fr.png'],
      ['Italian', 'https://flagcdn.com/w80/it.png']
    ];
    const langId = {};
    for (const [name, img] of langs) {
      const r = await pool.query('INSERT INTO languages(name,img_url) VALUES($1,$2) RETURNING id', [name, img]);
      langId[name] = r.rows[0].id;
    }
    const catalog = {
      English: [['English A1 - Basics & Survival','A1'],['English A2 - Everyday Conversations','A2'],['English B1 - Work & Travel','B1']],
      German:  [['German A1 - Grundlagen','A1'],['German A2 - Alltag & Einkaufen','A2'],['German B1 - Beruf & Reisen','B1']],
      Spanish: [['Spanish A1 - Basico','A1'],['Spanish A2 - Conversacion diaria','A2'],['Spanish B1 - Viajes & Cultura','B1']],
      French:  [['French A1 - Debutant','A1'],['French A2 - Vie quotidienne','A2'],['French B1 - Travail & Voyages','B1']],
      Italian: [['Italian A1 - Principianti','A1'],['Italian A2 - Conversazione','A2'],['Italian B1 - Lavoro & Viaggi','B1']]
    };
    for (const [lname, courses] of Object.entries(catalog)) {
      for (const [title, level] of courses) {
        const cr = await pool.query(
          'INSERT INTO courses(title,language_id,level,teacher_id,is_active) VALUES($1,$2,$3,$4,true) RETURNING id',
          [title, langId[lname], level, pick(TEACHERS)]);
        // upisi: nasumican podskup studenata po kursu
        const chosen = [...STUDENTS].sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 6));
        for (const sid of chosen) {
          await pool.query(
            'INSERT INTO enrollments(course_id,student_id,status) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
            [cr.rows[0].id, sid, pick(['active', 'completed', 'cancelled'])]);
        }
      }
    }
    console.log('[course-service] seed: 5 jezika, 15 kurseva, upisi ubaceni');
  }
}

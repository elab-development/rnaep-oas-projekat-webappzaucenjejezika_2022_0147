import pkg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'user-db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'user_db'
});

// Determinisicki seed: id-jevi su stabilni (SERIAL po redu unosa) pa ih
// course-service i lesson-service mogu referencirati (teacher_id / student_id).
//   admin=1 | teacheri=2,3,4 | studenti=5..17
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM users');
  if (rows[0].n === 0) {
    const hash = bcrypt.hashSync('password', 10);
    const seed = [
      ['Admin User', 'admin@mail.com', 'admin'],
      ['Teacher One', 'teacher@mail.com', 'teacher'],
      ['Ana Kovac', 'ana@mail.com', 'teacher'],
      ['Marko Jovic', 'marko@mail.com', 'teacher'],
      ['Student One', 'student@mail.com', 'student']
    ];
    for (let i = 1; i <= 12; i++) seed.push([`Student ${i}`, `student${i}@mail.com`, 'student']);
    for (const [name, email, role] of seed) {
      await pool.query(
        'INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4)',
        [name, email, hash, role]);
    }
    console.log('[user-service] seed: admin@mail.com / teacher@mail.com / student@mail.com (lozinka: password)');
  }
}

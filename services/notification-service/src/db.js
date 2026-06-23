import pkg from 'pg'; const {Pool}=pkg;
export const pool=new Pool({
  host:process.env.DB_HOST||'notification-db',port:process.env.DB_PORT||5432,
  user:process.env.DB_USER||'postgres',password:process.env.DB_PASSWORD||'postgres',
  database:process.env.DB_NAME||'notification_db'});
export async function initDb(){
  await pool.query(`
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE TABLE IF NOT EXISTS notifications(
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     recipient VARCHAR(255), channel VARCHAR(20), type VARCHAR(50),
     payload JSONB, status VARCHAR(20) DEFAULT 'SENT',
     created_at TIMESTAMPTZ DEFAULT now());`);
}

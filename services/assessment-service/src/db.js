import pkg from 'pg'; const {Pool}=pkg;
export const pool=new Pool({
  host:process.env.DB_HOST||'assessment-db',port:process.env.DB_PORT||5432,
  user:process.env.DB_USER||'postgres',password:process.env.DB_PASSWORD||'postgres',
  database:process.env.DB_NAME||'assessment_db'});
export async function initDb(){
  await pool.query(`
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE TABLE IF NOT EXISTS tests(
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     lesson_id UUID, title VARCHAR(255), pass_score INT DEFAULT 60);
   CREATE TABLE IF NOT EXISTS questions(
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
     text TEXT, options JSONB, correct_index INT, points INT DEFAULT 10);`);
  const c=await pool.query('SELECT count(*)::int AS n FROM tests');
  if(c.rows[0].n===0){
    const t=await pool.query("INSERT INTO tests(title,pass_score) VALUES('Basic English Quiz',60) RETURNING id");
    const id=t.rows[0].id;
    const qs=[
      ['How do you say "zdravo"?',["bye","hello","thanks"],1],
      ['Translate "jedan" to English:',["one","two","ten"],0],
      ['Present Simple of "to be" (I __):',["are","is","am"],2]
    ];
    for(const [text,opts,ci] of qs)
      await pool.query('INSERT INTO questions(test_id,text,options,correct_index) VALUES($1,$2,$3,$4)',
        [id,text,JSON.stringify(opts),ci]);
    console.log('[assessment-service] seed testa ubacen');
  }
}

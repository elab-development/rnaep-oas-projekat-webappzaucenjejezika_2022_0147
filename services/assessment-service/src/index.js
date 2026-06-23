import express from 'express'; import cors from 'cors';
import { pool, initDb } from './db.js';
import { connectBroker, publish } from './eventProducer.js';
const app=express(); app.use(cors()); app.use(express.json());
app.get('/health',(_q,r)=>r.json({status:'ok',service:'assessment-service'}));

app.get('/api/assessments', async (_q,res)=>{ const {rows}=await pool.query('SELECT id,title,pass_score FROM tests'); res.json(rows); });
app.get('/api/assessments/:id', async (req,res)=>{
  const t=await pool.query('SELECT id,title,pass_score FROM tests WHERE id=$1',[req.params.id]);
  if(!t.rows[0]) return res.status(404).json({error:'Test nije pronadjen'});
  // ne saljemo correct_index klijentu
  const q=await pool.query('SELECT id,text,options FROM questions WHERE test_id=$1',[req.params.id]);
  res.json({...t.rows[0], questions:q.rows});
});

// Automatsko ocenjivanje -> objavljuje TestCompleted dogadjaj
app.post('/api/assessments/:id/submit', async (req,res)=>{
  const { userId, answers } = req.body; // answers: { questionId: selectedIndex }
  const t=await pool.query('SELECT * FROM tests WHERE id=$1',[req.params.id]);
  if(!t.rows[0]) return res.status(404).json({error:'Test nije pronadjen'});
  const q=await pool.query('SELECT id,correct_index,points FROM questions WHERE test_id=$1',[req.params.id]);
  let score=0,max=0;
  for(const row of q.rows){ max+=row.points; if(answers?.[row.id]===row.correct_index) score+=row.points; }
  const pct=max?Math.round(score/max*100):0;
  const passed=pct>=t.rows[0].pass_score;
  publish('test.completed', { type:'TestCompleted', userId, testId:req.params.id,
    lessonId:t.rows[0].lesson_id, score:pct, maxScore:100, passed, submittedAt:new Date().toISOString() });
  res.json({ score:pct, passed, correct:score, max });
});

const PORT=process.env.PORT||3004;
initDb().then(connectBroker).then(()=>app.listen(PORT,()=>console.log(`[assessment-service] :${PORT}`)))
  .catch(e=>{console.error(e);process.exit(1);});

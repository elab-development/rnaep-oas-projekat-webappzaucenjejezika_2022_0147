import express from 'express'; import cors from 'cors';
import { pool, initDb } from './db.js';
import { EmailClient } from './clients.js';
import { startConsumer } from './consumer.js';
const app=express(); app.use(cors()); app.use(express.json());
app.get('/health',(_q,r)=>r.json({status:'ok',service:'notification-service'}));

// Direktan zahtev (npr. od User Service-a) - NotificationController
app.post('/api/notifications/send', async (req,res)=>{
  const { to, type, channel='EMAIL', payload } = req.body;
  if(!to) return res.status(400).json({error:'Polje "to" je obavezno'});
  await EmailClient.send(to, type||'GENERIC', payload);
  res.status(202).json({ ok:true });
});
app.get('/api/notifications', async (_q,res)=>{
  const {rows}=await pool.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'); res.json(rows);
});

const PORT=process.env.PORT||3006;
initDb().then(()=>{ startConsumer(); app.listen(PORT,()=>console.log(`[notification-service] :${PORT}`)); })
  .catch(e=>{console.error(e);process.exit(1);});

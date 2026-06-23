import express from 'express'; import cors from 'cors'; import crypto from 'crypto';
const app=express(); app.use(cors()); app.use(express.json({limit:'5mb'}));
// In-memory registar (u produkciji: eksterni Cloud Storage / S3)
const store=new Map();
app.get('/health',(_q,r)=>r.json({status:'ok',service:'media-service'}));
app.post('/api/media',(req,res)=>{
  const { filename, contentType } = req.body;
  const id=crypto.randomUUID();
  store.set(id,{ filename:filename||'file.bin', contentType:contentType||'application/octet-stream' });
  res.status(201).json({ id, url:`/api/media/${id}` });
});
app.get('/api/media/:id',(req,res)=>{
  const m=store.get(req.params.id);
  if(!m) return res.status(404).json({error:'Fajl nije pronadjen'});
  res.json(m);
});
const PORT=process.env.PORT||3008;
app.listen(PORT,()=>console.log(`[media-service] :${PORT}`));

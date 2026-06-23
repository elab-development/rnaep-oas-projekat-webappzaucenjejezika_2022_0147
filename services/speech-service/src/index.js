import express from 'express'; import cors from 'cors'; import amqp from 'amqplib';
const app=express(); app.use(cors()); app.use(express.json());
const URL=process.env.RABBITMQ_URL||'amqp://guest:guest@rabbitmq:5672'; const EX='learning.events';
let ch=null;
(async function connect(retries=10){ while(retries--){ try{
  const c=await amqp.connect(URL); ch=await c.createChannel(); await ch.assertExchange(EX,'topic',{durable:true});
  console.log('[speech-service] RabbitMQ OK'); break; }catch(e){ await new Promise(r=>setTimeout(r,4000)); } } })();

app.get('/health',(_q,r)=>r.json({status:'ok',service:'speech-service'}));

// SpeechRecognitionClient (simulira eksterni Speech Recognition SaaS) -> vraca tacnost izgovora
function analyzePronunciation(expected, spoken){
  const a=(expected||'').toLowerCase().trim(), b=(spoken||'').toLowerCase().trim();
  if(!a||!b) return 0;
  const setA=new Set(a.split('')); let hit=0;
  for(const c of b) if(setA.has(c)) hit++;
  return Math.min(100, Math.round(hit/Math.max(a.length,b.length)*100));
}
app.post('/api/speech/evaluate',(req,res)=>{
  const { userId, lessonId, expectedText, spokenText } = req.body;
  const accuracy=analyzePronunciation(expectedText, spokenText);
  const feedback=accuracy>=70?'Dobar izgovor!':'Vezbajte ritam i naglasak.';
  if(ch) ch.publish(EX,'speech.completed',Buffer.from(JSON.stringify({
    type:'SpeechExerciseCompleted',userId,lessonId,accuracyPercentage:accuracy,submittedAt:new Date().toISOString()})));
  res.json({ accuracyPercentage:accuracy, feedback });
});
const PORT=process.env.PORT||3007;
app.listen(PORT,()=>console.log(`[speech-service] :${PORT}`));

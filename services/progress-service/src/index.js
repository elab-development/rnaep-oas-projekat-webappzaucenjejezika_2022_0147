import express from 'express'; import mongoose from 'mongoose';
import { UserProgress } from './model.js'; import { startKafkaConsumer } from './consumer.js';
import { securityHeaders, corsAllowlist } from './security.js';
import { metricsMiddleware, mountMetrics } from './metrics.js';
const app=express();
app.use(securityHeaders()); app.use(corsAllowlist()); app.use(metricsMiddleware); app.use(express.json());
const MONGO=process.env.MONGO_URL||'mongodb://progress-db:27017/progress_db';

app.get('/health',(_q,r)=>r.json({status:'ok',service:'progress-service'}));
mountMetrics(app);

// ProgressController
app.get('/api/progress/:userId', async (req,res)=>{
  const rows=await UserProgress.find({ userId:req.params.userId });
  res.json(rows);
});
app.get('/api/progress/:userId/:courseId', async (req,res)=>{
  const d=await UserProgress.findOne({ userId:req.params.userId, courseId:req.params.courseId });
  res.json(d||{ userId:req.params.userId, courseId:req.params.courseId, progressPercentage:0, completedLessons:[], testResults:[] });
});

const PORT=process.env.PORT||3005;
mongoose.connect(MONGO).then(()=>{
  console.log('[progress-service] povezan na MongoDB');
  startKafkaConsumer();
  app.listen(PORT,()=>console.log(`[progress-service] :${PORT}`));
}).catch(e=>{console.error('Mongo greska:',e.message);process.exit(1);});

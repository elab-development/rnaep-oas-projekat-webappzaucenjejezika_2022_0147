import amqp from 'amqplib';
import { UserProgress } from './model.js';
const URL=process.env.RABBITMQ_URL||'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE='learning.events';

// ProgressEventConsumer - sluša dogadjaje iz Message Broker-a
export async function startConsumer(retries=10){
  while(retries--){ try{
    const conn=await amqp.connect(URL); const ch=await conn.createChannel();
    await ch.assertExchange(EXCHANGE,'topic',{durable:true});
    const q=await ch.assertQueue('progress.queue',{durable:true});
    await ch.bindQueue(q.queue,EXCHANGE,'lesson.completed');
    await ch.bindQueue(q.queue,EXCHANGE,'test.completed');
    await ch.bindQueue(q.queue,EXCHANGE,'enrollment.created');
    await ch.bindQueue(q.queue,EXCHANGE,'enrollment.updated');
    console.log('[progress-service] consumer aktivan');
    ch.consume(q.queue, async msg=>{
      if(!msg) return;
      const e=JSON.parse(msg.content.toString());
      try { await handle(e); ch.ack(msg); }
      catch(err){ console.error('[progress-service] greska obrade:',err.message); ch.nack(msg,false,false); }
    });
    return;
  }catch(e){ console.log('[progress-service] cekam RabbitMQ...'); await new Promise(r=>setTimeout(r,4000)); } }
}

async function handle(e){
  // IT tok: upis studenta -> evidentiramo napredak po (student, kurs)
  if(e.type==='EnrollmentCreated' || e.type==='EnrollmentUpdated'){
    const f={ userId:String(e.student_id), courseId:String(e.course_id) };
    let d=await UserProgress.findOne(f) || new UserProgress(f);
    d.enrollmentStatus=e.status; d.courseTitle=e.course_title; d.lastActivityAt=new Date();
    await d.save();
    console.log(`[progress-service] upis evidentiran: student ${e.student_id} / kurs ${e.course_id} (${e.status})`);
    return;
  }
  const filter={ userId:e.userId, courseId:e.courseId||'default' };
  let doc=await UserProgress.findOne(filter) || new UserProgress(filter);
  if(e.type==='LessonCompleted'){
    if(!doc.completedLessons.some(l=>l.lessonId===e.lessonId))
      doc.completedLessons.push({ lessonId:e.lessonId, completedAt:e.completedAt });
    doc.progressPercentage=Math.min(100, doc.completedLessons.length*20);
  }
  if(e.type==='TestCompleted'){
    doc.testResults.push({ testId:e.testId, lessonId:e.lessonId, score:e.score, passed:e.passed, submittedAt:e.submittedAt });
  }
  doc.lastActivityAt=new Date();
  await doc.save();
  console.log(`[progress-service] azuriran napredak za ${e.userId} (${e.type})`);
}

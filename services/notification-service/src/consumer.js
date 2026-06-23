import amqp from 'amqplib';
import { EmailClient, PushClient } from './clients.js';
const URL=process.env.RABBITMQ_URL||'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE='learning.events';
export async function startConsumer(retries=10){
  while(retries--){ try{
    const conn=await amqp.connect(URL); const ch=await conn.createChannel();
    await ch.assertExchange(EXCHANGE,'topic',{durable:true});
    const q=await ch.assertQueue('notification.queue',{durable:true});
    await ch.bindQueue(q.queue,EXCHANGE,'lesson.completed');
    await ch.bindQueue(q.queue,EXCHANGE,'test.completed');
    await ch.bindQueue(q.queue,EXCHANGE,'enrollment.created');
    await ch.bindQueue(q.queue,EXCHANGE,'enrollment.updated');
    console.log('[notification-service] consumer aktivan');
    ch.consume(q.queue, async msg=>{
      if(!msg) return; const e=JSON.parse(msg.content.toString());
      const to=e.userId||e.student_id||e.student_name||'korisnik';
      if(e.type==='LessonCompleted')  await PushClient.send(to,'LESSON_DONE',e);
      if(e.type==='TestCompleted')   await EmailClient.send(to,'TEST_RESULT',e);
      if(e.type==='EnrollmentCreated') await PushClient.send(to,'ENROLLED',e);
      if(e.type==='EnrollmentUpdated') await EmailClient.send(to,'ENROLLMENT_STATUS',e);
      ch.ack(msg);
    });
    return;
  }catch(e){ console.log('[notification-service] cekam RabbitMQ...'); await new Promise(r=>setTimeout(r,4000)); } }
}

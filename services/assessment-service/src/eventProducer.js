import amqp from 'amqplib';
const URL=process.env.RABBITMQ_URL||'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE='learning.events'; let channel=null;
export async function connectBroker(retries=10){
  while(retries--){ try{
    const c=await amqp.connect(URL); channel=await c.createChannel();
    await channel.assertExchange(EXCHANGE,'topic',{durable:true});
    console.log('[assessment-service] povezan na RabbitMQ'); return;
  }catch(e){ console.log('[assessment-service] cekam RabbitMQ...'); await new Promise(r=>setTimeout(r,4000)); } }
}
export function publish(rk,p){ if(!channel)return; channel.publish(EXCHANGE,rk,Buffer.from(JSON.stringify(p)),{persistent:true});
  console.log(`[assessment-service] objavljen dogadjaj ${rk}`); }

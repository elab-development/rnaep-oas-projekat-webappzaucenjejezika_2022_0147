import { pool } from './db.js';
async function record(recipient,channel,type,payload){
  await pool.query('INSERT INTO notifications(recipient,channel,type,payload) VALUES($1,$2,$3,$4)',
    [recipient,channel,type,JSON.stringify(payload||{})]);
}
export const EmailClient={ async send(to,type,payload){ console.log(`[EMAIL -> ${to}] ${type}`); await record(to,'EMAIL',type,payload); } };
export const PushClient ={ async send(to,type,payload){ console.log(`[PUSH  -> ${to}] ${type}`); await record(to,'PUSH',type,payload); } };

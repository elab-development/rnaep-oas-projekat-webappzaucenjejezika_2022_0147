// Pozivi ka drugim servisima (interna mreza) + event producer (RabbitMQ).
import amqp from 'amqplib';

const USER   = process.env.USER_SERVICE_URL   || 'http://user-service:3001';
const LESSON = process.env.LESSON_SERVICE_URL || 'http://lesson-service:3003';

export const UserClient = {
  async byIds(ids = []) {
    const uniq = [...new Set(ids.filter(Boolean))];
    if (!uniq.length) return {};
    try {
      const r = await fetch(`${USER}/internal/users?ids=${uniq.join(',')}`);
      const arr = await r.json();
      return Object.fromEntries(arr.map(u => [u.id, u]));
    } catch { return {}; }
  },
  async one(id) {
    try { const r = await fetch(`${USER}/internal/users/${id}`); return r.ok ? await r.json() : null; }
    catch { return null; }
  },
  async stats() {
    try { const r = await fetch(`${USER}/internal/users/stats`); return await r.json(); }
    catch { return { users_total: 0, users_by_role: [] }; }
  }
};

export const LessonClient = {
  async stats() {
    try { const r = await fetch(`${LESSON}/internal/lessons/stats`); return await r.json(); }
    catch { return { lessons_total: 0, lessons_per_month: [] }; }
  }
};

// --- Event producer ---
const RURL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const EXCHANGE = 'learning.events';
let channel = null;
export async function connectBroker(retries = 10) {
  while (retries--) {
    try {
      const conn = await amqp.connect(RURL);
      channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      console.log('[course-service] povezan na RabbitMQ');
      return;
    } catch (e) {
      console.log('[course-service] cekam RabbitMQ...', e.message);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}
export function publish(routingKey, payload) {
  if (!channel) return;
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  console.log(`[course-service] event ${routingKey}`);
}

// Kafka consumer: sluša 'notification-requested' i belezi notifikaciju.
import { startConsumer, withRetry, ensureTopics, TOPICS } from './kafka.js';
import { EmailClient, PushClient } from './clients.js';

export async function startKafkaConsumer() {
  await withRetry(async () => {
    await ensureTopics([TOPICS.NOTIFICATION_REQUESTED]);
    await startConsumer('notification-service', [TOPICS.NOTIFICATION_REQUESTED], async (_topic, e) => {
      const to = e.recipient || e.student_id || 'korisnik';
      const client = (e.channel === 'push') ? PushClient : EmailClient;
      await client.send(to, e.subject || 'NOTIFICATION', e);
    });
  }, 'kafka');
}

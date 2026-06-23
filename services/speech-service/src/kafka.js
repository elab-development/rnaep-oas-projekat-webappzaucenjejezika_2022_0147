// Zajednicki Kafka helper (kafkajs). Koriste ga producer/consumer servisi.
import { Kafka, logLevel } from 'kafkajs';
import { countKafka } from './metrics.js';

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
const clientId = process.env.SERVICE_NAME || 'service';

export const TOPICS = {
  ENROLLMENT_CREATED: 'enrollment-created',
  ENROLLMENT_STATUS_CHANGED: 'enrollment-status-changed',
  NOTIFICATION_REQUESTED: 'notification-requested',
  PROGRESS_UPDATED: 'progress-updated',
  DLQ: 'learning-dlq'
};

export const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.NOTHING,
  retry: { initialRetryTime: 2000, retries: 12 } });

let producer = null;
export async function getProducer() {
  if (!producer) { producer = kafka.producer(); await producer.connect(); }
  return producer;
}

// Idempotentno kreiranje topika (definicija topika sistema).
export async function ensureTopics(list = Object.values(TOPICS)) {
  const admin = kafka.admin();
  try {
    await admin.connect();
    await admin.createTopics({
      topics: list.map(t => ({ topic: t, numPartitions: 1, replicationFactor: 1 })),
      waitForLeaders: true
    });
    console.log(`[${clientId}] topici osigurani:`, list.join(', '));
  } catch (e) { console.log(`[${clientId}] ensureTopics:`, e.message); }
  finally { await admin.disconnect().catch(() => {}); }
}

export async function publish(topic, message, key = null) {
  const p = await getProducer();
  await p.send({ topic, messages: [{ key, value: JSON.stringify(message) }] });
  countKafka(topic, 'produced');
  console.log(`[${clientId}] -> ${topic}`);
}

export async function startConsumer(groupId, topics, handler) {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  for (const t of topics) await consumer.subscribe({ topic: t, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      countKafka(topic, 'consumed');
      const payload = JSON.parse(message.value.toString());
      await handler(topic, payload);
    }
  });
  console.log(`[${clientId}] consumer grupe ${groupId} slusa:`, topics.join(', '));
  return consumer;
}

// Retry wrapper za podizanje uz Kafku koja se tek startuje.
export async function withRetry(fn, label = 'kafka', retries = 15) {
  while (retries--) {
    try { return await fn(); }
    catch (e) { console.log(`[${clientId}] cekam ${label}... (${e.message})`); await new Promise(r => setTimeout(r, 4000)); }
  }
  throw new Error(`${label}: nije uspela konekcija`);
}

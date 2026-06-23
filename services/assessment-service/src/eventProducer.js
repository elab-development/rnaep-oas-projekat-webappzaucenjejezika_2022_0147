// Kafka producer za assessment dogadjaje (objavljuje na 'progress-updated').
import { publish as kafkaPublish, ensureTopics, getProducer, withRetry, TOPICS } from './kafka.js';
export async function connectBroker() {
  await withRetry(async () => { await ensureTopics([TOPICS.PROGRESS_UPDATED]); await getProducer(); }, 'kafka');
  console.log('[assessment-service] Kafka producer spreman');
}
export const publish = kafkaPublish;
export { TOPICS };

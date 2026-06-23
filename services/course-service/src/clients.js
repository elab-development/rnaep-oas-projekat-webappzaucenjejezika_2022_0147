// Cross-service pozivi sa CIRCUIT BREAKER paternom (opossum) + Kafka producer.
import CircuitBreaker from 'opossum';
import { publish as kafkaPublish, ensureTopics, getProducer, withRetry, TOPICS } from './kafka.js';

const USER   = process.env.USER_SERVICE_URL   || 'http://user-service:3001';
const LESSON = process.env.LESSON_SERVICE_URL || 'http://lesson-service:3003';

const BREAKER = { timeout: 4000, errorThresholdPercentage: 50, resetTimeout: 8000 };

async function _usersByIds(ids = []) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {};
  const r = await fetch(`${USER}/internal/users?ids=${uniq.join(',')}`);
  if (!r.ok) throw new Error('user-service ' + r.status);
  const arr = await r.json();
  return Object.fromEntries(arr.map(u => [u.id, u]));
}
async function _userOne(id) {
  const r = await fetch(`${USER}/internal/users/${id}`);
  if (!r.ok) throw new Error('user-service ' + r.status);
  return r.json();
}
async function _userStats() {
  const r = await fetch(`${USER}/internal/users/stats`);
  if (!r.ok) throw new Error('user-service ' + r.status);
  return r.json();
}
async function _lessonStats() {
  const r = await fetch(`${LESSON}/internal/lessons/stats`);
  if (!r.ok) throw new Error('lesson-service ' + r.status);
  return r.json();
}

// Svaki poziv ide kroz svoj prekidac sa fallback-om (otporno na pad zavisnog servisa).
const byIdsCB  = new CircuitBreaker(_usersByIds, BREAKER); byIdsCB.fallback(() => ({}));
const oneCB    = new CircuitBreaker(_userOne, BREAKER);    oneCB.fallback(() => null);
const uStatsCB = new CircuitBreaker(_userStats, BREAKER);  uStatsCB.fallback(() => ({ users_total: 0, users_by_role: [] }));
const lStatsCB = new CircuitBreaker(_lessonStats, BREAKER);lStatsCB.fallback(() => ({ lessons_total: 0, lessons_per_month: [] }));

export const UserClient = {
  byIds: (ids) => byIdsCB.fire(ids),
  one:   (id)  => oneCB.fire(id),
  stats: ()    => uStatsCB.fire()
};
export const LessonClient = { stats: () => lStatsCB.fire() };

// --- Kafka producer ---
export async function connectBroker() {
  await withRetry(async () => {
    await ensureTopics([TOPICS.ENROLLMENT_CREATED, TOPICS.ENROLLMENT_STATUS_CHANGED]);
    await getProducer();
  }, 'kafka');
  console.log('[course-service] Kafka producer spreman');
}
export const publish = kafkaPublish;
export { TOPICS };

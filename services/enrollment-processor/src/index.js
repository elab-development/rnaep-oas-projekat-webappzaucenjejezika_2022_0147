// ENROLLMENT PROCESSOR - hibridni modul (Consumer + Producer).
// Tok: konzumira 'enrollment-created' -> poslovna logika -> objavljuje
//      'notification-requested' i 'progress-updated'. Greske -> 'learning-dlq'.
import express from 'express';
import { startConsumer, publish, ensureTopics, withRetry, TOPICS } from './kafka.js';
import { metricsMiddleware, mountMetrics } from './metrics.js';

const app = express();
app.use(metricsMiddleware);
app.get('/health', (_q, r) => r.json({ status: 'ok', service: 'enrollment-processor' }));
mountMetrics(app);

// Poslovna logika nad dogadjajem upisa.
async function handleEnrollmentCreated(e) {
  // 1) odluka o dobrodoslici (notifikacija)
  const notification = {
    type: 'NotificationRequested',
    channel: 'email',
    student_id: e.student_id,
    recipient: e.student_name || `student#${e.student_id}`,
    subject: 'Dobrodosli na kurs',
    message: `Uspesno ste upisani na kurs "${e.course_title}". Srecno sa ucenjem!`,
    enrollment_id: e.id,
    createdAt: new Date().toISOString()
  };
  // 2) inicijalni zapis napretka (read model)
  const progress = {
    type: 'ProgressUpdated',
    student_id: e.student_id,
    course_id: e.course_id,
    course_title: e.course_title,
    enrollment_status: e.status || 'active',
    progressPercentage: 0,
    source: 'enrollment',
    updatedAt: new Date().toISOString()
  };
  await publish(TOPICS.NOTIFICATION_REQUESTED, notification, String(e.student_id));
  await publish(TOPICS.PROGRESS_UPDATED, progress, `${e.student_id}:${e.course_id}`);
  console.log(`[processor] obradjen upis #${e.id} (student ${e.student_id}, kurs ${e.course_id})`);
}

async function onMessage(topic, payload) {
  try {
    if (topic === TOPICS.ENROLLMENT_CREATED) await handleEnrollmentCreated(payload);
  } catch (err) {
    console.error('[processor] greska obrade:', err.message);
    await publish(TOPICS.DLQ, { failedTopic: topic, error: err.message, payload, at: new Date().toISOString() });
  }
}

const PORT = process.env.PORT || 3009;
withRetry(async () => {
  await ensureTopics();
  await startConsumer('enrollment-processor', [TOPICS.ENROLLMENT_CREATED], onMessage);
}, 'kafka')
  .then(() => app.listen(PORT, () => console.log(`[enrollment-processor] :${PORT}`)))
  .catch(e => { console.error(e); process.exit(1); });

// Speech Service - speaking vezbe; Kafka producer (objavljuje 'progress-updated').
import express from 'express';
import { publish, ensureTopics, getProducer, withRetry, TOPICS } from './kafka.js';
import { securityHeaders, corsAllowlist, sanitizeBody } from './security.js';
import { metricsMiddleware, mountMetrics } from './metrics.js';

const app = express();
app.use(securityHeaders()); app.use(corsAllowlist()); app.use(metricsMiddleware);
app.use(express.json()); app.use(sanitizeBody);
app.get('/health', (_q, r) => r.json({ status: 'ok', service: 'speech-service' }));
mountMetrics(app);

function analyzePronunciation(expected, spoken) {
  const a = (expected || '').toLowerCase().trim(), b = (spoken || '').toLowerCase().trim();
  if (!a || !b) return 0;
  const setA = new Set(a.split('')); let hit = 0;
  for (const c of b) if (setA.has(c)) hit++;
  return Math.min(100, Math.round(hit / Math.max(a.length, b.length) * 100));
}

app.post('/api/speech/evaluate', async (req, res) => {
  const { userId, courseId = 0, lessonId, expectedText, spokenText } = req.body || {};
  const accuracy = analyzePronunciation(expectedText, spokenText);
  const feedback = accuracy >= 70 ? 'Dobar izgovor!' : 'Vezbajte ritam i naglasak.';
  try {
    await publish(TOPICS.PROGRESS_UPDATED, {
      type: 'SpeechExerciseCompleted', student_id: userId, course_id: courseId,
      lessonId, accuracyPercentage: accuracy, source: 'speech', submittedAt: new Date().toISOString()
    }, String(userId));
  } catch (e) { console.error('[speech-service] publish:', e.message); }
  res.json({ accuracyPercentage: accuracy, feedback });
});

const PORT = process.env.PORT || 3007;
withRetry(async () => { await ensureTopics([TOPICS.PROGRESS_UPDATED]); await getProducer(); }, 'kafka')
  .then(() => app.listen(PORT, () => console.log(`[speech-service] :${PORT}`)))
  .catch(e => { console.error(e); process.exit(1); });

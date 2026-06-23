// Kafka consumer: 'progress-updated' -> azurira read model napretka (MongoDB).
import { startConsumer, withRetry, ensureTopics, TOPICS } from './kafka.js';
import { UserProgress } from './model.js';

export async function startKafkaConsumer() {
  await withRetry(async () => {
    await ensureTopics([TOPICS.PROGRESS_UPDATED]);
    await startConsumer('progress-service', [TOPICS.PROGRESS_UPDATED], async (_topic, e) => {
      const f = { userId: String(e.student_id), courseId: String(e.course_id) };
      const d = (await UserProgress.findOne(f)) || new UserProgress(f);
      if (e.course_title) d.courseTitle = e.course_title;
      if (e.enrollment_status) d.enrollmentStatus = e.enrollment_status;
      if (typeof e.progressPercentage === 'number') d.progressPercentage = e.progressPercentage;
      if (e.lessonId && !d.completedLessons.some(l => l.lessonId === String(e.lessonId)))
        d.completedLessons.push({ lessonId: String(e.lessonId), completedAt: new Date() });
      if (e.testId)
        d.testResults.push({ testId: String(e.testId), score: e.score, passed: !!e.passed, submittedAt: new Date() });
      d.lastActivityAt = new Date();
      await d.save();
      console.log(`[progress-service] read model azuriran: student ${e.student_id} / kurs ${e.course_id}`);
    });
  }, 'kafka');
}

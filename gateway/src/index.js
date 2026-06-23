// API Gateway - jedinstvena ulazna tacka sistema (C4: Container "API Gateway").
// Prosledjuje (reverse proxy) zahteve odgovarajucim mikroservisima.
// Ugovor /api/* je 1:1 sa frontendom iz projekta Internet tehnologija.
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());
app.use(morgan('dev'));

const USER   = process.env.USER_SERVICE_URL         || 'http://user-service:3001';
const COURSE = process.env.COURSE_SERVICE_URL       || 'http://course-service:3002';
const LESSON = process.env.LESSON_SERVICE_URL       || 'http://lesson-service:3003';
const ASSESS = process.env.ASSESSMENT_SERVICE_URL   || 'http://assessment-service:3004';
const PROGR  = process.env.PROGRESS_SERVICE_URL     || 'http://progress-service:3005';
const NOTIF  = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
const SPEECH = process.env.SPEECH_SERVICE_URL       || 'http://speech-service:3007';
const MEDIA  = process.env.MEDIA_SERVICE_URL         || 'http://media-service:3008';

// Redosled je bitan: specificniji prefiksi pre opstijih.
const routes = [
  // --- Auth (user-service) ---
  ['/api/register',     USER],
  ['/api/login',        USER],
  ['/api/logout',       USER],
  ['/api/me',           USER],

  // --- Languages / Courses / Enrollments / Admin (course-service) ---
  ['/api/languages',    COURSE],
  ['/api/courses',      COURSE],
  ['/api/teacher',      COURSE],   // /api/teacher/:id/courses
  ['/api/enrollments',  COURSE],
  ['/api/student',      COURSE],   // /api/student/:id/enrollments
  ['/api/admin',        COURSE],   // /api/admin/stats

  // --- Lessons / Translate / Dictionary (lesson-service) ---
  ['/api/lessons',      LESSON],
  ['/api/translate',    LESSON],
  ['/api/dictionary',   LESSON],

  // --- Ostali servisi projektovani u Domacem I (dostupni kroz gateway) ---
  ['/api/assessments',  ASSESS],
  ['/api/progress',     PROGR],
  ['/api/notifications',NOTIF],
  ['/api/speech',       SPEECH],
  ['/api/media',        MEDIA]
];

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

for (const [path, target] of routes) {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (p, req) => req.originalUrl // zadrzi pun /api/... put ka servisu
  }));
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`[gateway] slusa na :${PORT}`));

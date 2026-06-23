// API Gateway - jedinstvena ulazna tacka. Reverse-proxy + sigurnosni sloj + metrike.
import express from 'express';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { securityHeaders, corsAllowlist, csrfOriginGuard } from './security.js';
import { metricsMiddleware, mountMetrics } from './metrics.js';

const app = express();
app.use(securityHeaders());        // XSS/clickjacking/MIME zaglavlja (helmet)
app.use(corsAllowlist());          // CORS: samo autorizovani domeni (klijent)
app.use(csrfOriginGuard);          // anti-CSRF: Origin provera za POST/PUT/DELETE
app.use(metricsMiddleware);        // Prometheus metrike
app.use(morgan('dev'));

const USER   = process.env.USER_SERVICE_URL         || 'http://user-service:3001';
const COURSE = process.env.COURSE_SERVICE_URL       || 'http://course-service:3002';
const LESSON = process.env.LESSON_SERVICE_URL       || 'http://lesson-service:3003';
const ASSESS = process.env.ASSESSMENT_SERVICE_URL   || 'http://assessment-service:3004';
const PROGR  = process.env.PROGRESS_SERVICE_URL     || 'http://progress-service:3005';
const NOTIF  = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
const SPEECH = process.env.SPEECH_SERVICE_URL       || 'http://speech-service:3007';
const MEDIA  = process.env.MEDIA_SERVICE_URL         || 'http://media-service:3008';

const routes = [
  ['/api/register', USER], ['/api/login', USER], ['/api/logout', USER], ['/api/me', USER],
  ['/api/languages', COURSE], ['/api/courses', COURSE], ['/api/teacher', COURSE],
  ['/api/enrollments', COURSE], ['/api/student', COURSE], ['/api/admin', COURSE],
  ['/api/lessons', LESSON], ['/api/translate', LESSON], ['/api/dictionary', LESSON],
  ['/api/assessments', ASSESS], ['/api/progress', PROGR], ['/api/notifications', NOTIF],
  ['/api/speech', SPEECH], ['/api/media', MEDIA]
];

app.get('/health', (_q, r) => r.json({ status: 'ok', service: 'api-gateway' }));
mountMetrics(app);                 // /metrics za Prometheus

for (const [path, target] of routes) {
  app.use(path, createProxyMiddleware({
    target, changeOrigin: true,
    pathRewrite: (p, req) => req.originalUrl
  }));
}

// Centralni error handler - bez curenja stack trace-a klijentu
app.use((err, _req, res, _next) => {
  console.error('[gateway] error:', err.message);
  res.status(500).json({ error: 'Interna greska' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`[gateway] slusa na :${PORT}`));

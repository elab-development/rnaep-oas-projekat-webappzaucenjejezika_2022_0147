// Zajednicki sigurnosni sloj: XSS (helmet + sanitizacija), CORS allowlist, anti-CSRF (Origin).
import helmet from 'helmet';
import cors from 'cors';
import xss from 'xss';

const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());

// CORS: dozvoljen pristup ISKLJUCIVO klijentskoj aplikaciji (autorizovani domeni).
export function corsAllowlist() {
  return cors({
    // ne bacamo gresku: za nedozvoljen origin samo izostavljamo CORS zaglavlja
    // (browser tada blokira odgovor), a izricit 403 daje csrfOriginGuard.
    origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
}

// XSS/clickjacking/MIME zastita kroz bezbednosne HTTP zaglavlja.
export function securityHeaders() {
  return helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } });
}

// Anti-CSRF: zahtevi koji menjaju stanje moraju doci sa autorizovanog Origin-a.
export function csrfOriginGuard(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && !allowed.includes(origin))
      return res.status(403).json({ error: 'CSRF zastita: Origin nije autorizovan' });
  }
  next();
}

// XSS: enkodiranje/ciscenje ulaznih stringova pre obrade i upisa.
function deepSanitize(v) {
  if (typeof v === 'string') return xss(v);
  if (Array.isArray(v)) return v.map(deepSanitize);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = deepSanitize(v[k]); return o; }
  return v;
}
export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = deepSanitize(req.body);
  next();
}

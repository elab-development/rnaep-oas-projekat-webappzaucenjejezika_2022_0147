// Zajednicki Prometheus helper (prom-client). Izlaze /metrics + standardne metrike.
import client from 'prom-client';

const prefix = (process.env.SERVICE_NAME || 'service').replace(/-/g, '_') + '_';
export const register = new client.Registry();
register.setDefaultLabels({ service: process.env.SERVICE_NAME || 'service' });
client.collectDefaultMetrics({ register, prefix });

const httpRequests = new client.Counter({
  name: 'http_requests_total', help: 'Ukupan broj HTTP zahteva',
  labelNames: ['method', 'route', 'status'], registers: [register]
});
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds', help: 'Trajanje HTTP zahteva',
  labelNames: ['method', 'route', 'status'], buckets: [0.01, 0.05, 0.1, 0.3, 1, 3],
  registers: [register]
});
const kafkaMessages = new client.Counter({
  name: 'kafka_messages_total', help: 'Broj Kafka poruka (produced/consumed)',
  labelNames: ['topic', 'role'], registers: [register]
});

export function countKafka(topic, role) { kafkaMessages.inc({ topic, role }); }

export function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequests.inc(labels); end(labels);
  });
  next();
}

export function mountMetrics(app) {
  app.get('/metrics', async (_q, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
}

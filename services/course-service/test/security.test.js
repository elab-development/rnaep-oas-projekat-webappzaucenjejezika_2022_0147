import { test } from 'node:test';
import assert from 'node:assert';
import { sanitizeBody } from '../src/security.js';

test('sanitizeBody neutralise XSS payload u telu zahteva', () => {
  const req = { body: { name: '<script>alert(1)</script>Bob', nested: { t: '<img src=x onerror=alert(1)>' } } };
  sanitizeBody(req, {}, () => {});
  assert.ok(!req.body.name.includes('<script>'), 'skripta mora biti neutralisana');
  assert.ok(req.body.name.includes('Bob'), 'legitiman tekst ostaje');
  assert.ok(!/onerror=/.test(req.body.nested.t), 'onerror atribut mora biti uklonjen/enkodiran');
});

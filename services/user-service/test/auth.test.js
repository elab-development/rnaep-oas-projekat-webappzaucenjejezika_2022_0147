import { test } from 'node:test';
import assert from 'node:assert';
import { issueToken, verifyToken } from '../src/auth.js';

test('JWT token sadrzi id i ulogu i moze da se verifikuje', () => {
  const token = issueToken({ id: 7, role: 'teacher', name: 'Ana', email: 'ana@mail.com' });
  const decoded = verifyToken(token);
  assert.equal(decoded.sub, 7);
  assert.equal(decoded.role, 'teacher');
  assert.equal(decoded.email, 'ana@mail.com');
});

test('Neispravan token baca gresku', () => {
  assert.throws(() => verifyToken('nevalidan.token.ovde'));
});

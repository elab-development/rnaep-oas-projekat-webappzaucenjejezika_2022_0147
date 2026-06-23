import { test } from 'node:test';
import assert from 'node:assert';
import { TranslateClient } from '../src/externalClients.js';

test('Mapiranje naziva i ISO kodova jezika', () => {
  assert.equal(TranslateClient.iso('English'), 'en');
  assert.equal(TranslateClient.iso('German'), 'de');
  assert.equal(TranslateClient.iso('de'), 'de');
  assert.equal(TranslateClient.iso('Spanish'), 'es');
});

import { describe, it, expect } from 'vitest';
import { getFlagUrlByLang, getLangLabel } from '../lib/flags';

describe('flags lib', () => {
  it('builds FlagCDN url for known language', () => {
    expect(getFlagUrlByLang('en', 40)).toContain('flagcdn.com/w40/gb.png');
    expect(getFlagUrlByLang('de', 40)).toContain('flagcdn.com/w40/de.png');
  });

  it('falls back to UN for unknown language', () => {
    expect(getFlagUrlByLang('xx', 40)).toContain('flagcdn.com/w40/un.png');
  });

  it('returns readable labels', () => {
    expect(getLangLabel('en')).toBe('English');
    expect(getLangLabel('de')).toBe('German');
  });
});

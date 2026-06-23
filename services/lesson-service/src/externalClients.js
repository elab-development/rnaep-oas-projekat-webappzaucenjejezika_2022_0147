// Eksterni API-ji sa CIRCUIT BREAKER paternom (opossum) + fallback odgovorima.
import axios from 'axios';
import CircuitBreaker from 'opossum';

const BREAKER = { timeout: 12000, errorThresholdPercentage: 50, resetTimeout: 10000 };

// EKSTERNI API #1: Free Dictionary API (open-source, besplatan)
const DICT = process.env.DICTIONARY_API_URL || 'https://api.dictionaryapi.dev/api/v2/entries';
async function _dict(word, lang = 'en') {
  const { data } = await axios.get(`${DICT}/${lang}/${encodeURIComponent(word)}`, { timeout: 8000 });
  const e = data[0] || {};
  return {
    word: e.word,
    phonetic: e.phonetic || e.phonetics?.find(p => p.text)?.text || null,
    audio: e.phonetics?.find(p => p.audio)?.audio || null,
    meanings: (e.meanings || []).map(m => ({
      partOfSpeech: m.partOfSpeech, definitions: m.definitions.slice(0, 3).map(d => d.definition)
    }))
  };
}
const dictCB = new CircuitBreaker(_dict, BREAKER);
dictCB.fallback((word) => ({ word, meanings: [], note: 'Recnik trenutno nedostupan (circuit breaker)' }));
export const DictionaryClient = { lookup: (w, l) => dictCB.fire(w, l) };

// EKSTERNI API #2: LibreTranslate (open-source, self-hostovan, bez kljuca)
const LT = process.env.LIBRETRANSLATE_URL || 'http://libretranslate:5000';
const MAP = {
  english:'en',en:'en', german:'de',de:'de', french:'fr',fr:'fr', spanish:'es',es:'es',
  italian:'it',it:'it', portuguese:'pt',pt:'pt', serbian:'sr',sr:'sr', russian:'ru',ru:'ru',
  japanese:'ja',ja:'ja', chinese:'zh',zh:'zh'
};
async function _translate(q, s, t) {
  const { data } = await axios.post(`${LT}/translate`,
    { q, source: s, target: t, format: 'text' },
    { headers: { 'Content-Type': 'application/json' }, timeout: 12000 });
  return { source: { lang: s, text: q }, target: { lang: t, text: data.translatedText }, provider: 'LibreTranslate' };
}
const translateCB = new CircuitBreaker(_translate, BREAKER);
translateCB.fallback((q, s, t) => ({
  source: { lang: s, text: q },
  target: { lang: t, text: '[prevod trenutno nedostupan]' },
  provider: 'fallback'
}));
export const TranslateClient = {
  iso(x) { const k = String(x || '').toLowerCase().trim(); return MAP[k] || k; },
  async translate(q, source, target) {
    const s = this.iso(source), t = this.iso(target);
    if (s.length !== 2 || t.length !== 2) { const e = new Error('bad-lang'); e.code = 422; throw e; }
    return translateCB.fire(q, s, t);
  }
};

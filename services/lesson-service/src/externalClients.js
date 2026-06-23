import axios from 'axios';

// EKSTERNI API #1: Free Dictionary API (open-source, besplatan, bez kljuca)
const DICT = process.env.DICTIONARY_API_URL || 'https://api.dictionaryapi.dev/api/v2/entries';
export const DictionaryClient = {
  async lookup(word, lang = 'en') {
    const { data } = await axios.get(`${DICT}/${lang}/${encodeURIComponent(word)}`, { timeout: 8000 });
    const e = data[0] || {};
    return {
      word: e.word,
      phonetic: e.phonetic || e.phonetics?.find(p => p.text)?.text || null,
      audio: e.phonetics?.find(p => p.audio)?.audio || null,
      meanings: (e.meanings || []).map(m => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map(d => d.definition)
      }))
    };
  }
};

// EKSTERNI API #2: LibreTranslate (open-source, AGPL, self-hostovan, bez kljuca)
const LT = process.env.LIBRETRANSLATE_URL || 'http://libretranslate:5000';
const MAP = {
  english:'en',en:'en', german:'de',de:'de', french:'fr',fr:'fr', spanish:'es',es:'es',
  italian:'it',it:'it', portuguese:'pt',pt:'pt', serbian:'sr',sr:'sr', russian:'ru',ru:'ru',
  japanese:'ja',ja:'ja', chinese:'zh',zh:'zh'
};
export const TranslateClient = {
  iso(x) { const k = String(x || '').toLowerCase().trim(); return MAP[k] || k; },
  async translate(q, source, target) {
    const s = this.iso(source), t = this.iso(target);
    if (s.length !== 2 || t.length !== 2) {
      const err = new Error('bad-lang'); err.code = 422; throw err;
    }
    const { data } = await axios.post(`${LT}/translate`,
      { q, source: s, target: t, format: 'text' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 12000 });
    return {
      source: { lang: s, text: q },
      target: { lang: t, text: data.translatedText },
      provider: 'LibreTranslate'
    };
  }
};

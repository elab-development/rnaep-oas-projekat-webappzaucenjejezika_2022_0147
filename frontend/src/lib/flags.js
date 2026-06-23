// Mapiranje jezika -> "država" za zastavu (nije savršeno, ali radi za UI)
// npr. English -> GB, German -> DE, French -> FR...
const LANG_TO_COUNTRY = {
  en: 'gb',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pt: 'pt',
  sr: 'rs',
  ru: 'ru',
  ja: 'jp',
  zh: 'cn',
};

// FlagCDN format: https://flagcdn.com/w40/{country}.png
export function getFlagUrlByLang(langIso2, size = 40) {
  const iso = String(langIso2 || '').toLowerCase();
  const country = LANG_TO_COUNTRY[iso] || 'un';
  return `https://flagcdn.com/w${size}/${country}.png`;
}

export function getLangLabel(langIso2) {
  const iso = String(langIso2 || '').toLowerCase();
  const labels = {
    en: 'English',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portugese',
    sr: 'Serbian',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese',
  };
  return labels[iso] || iso.toUpperCase();
}

export const SUPPORTED_LANGS = [
  { code: 'en' },
  { code: 'de' },
  { code: 'fr' },
  { code: 'es' },
  { code: 'it' },
  { code: 'pt' },
  { code: 'sr' },
  { code: 'ru' },
  { code: 'ja' },
  { code: 'zh' },
];

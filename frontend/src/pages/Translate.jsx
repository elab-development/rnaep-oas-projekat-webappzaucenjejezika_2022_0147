import { useMemo, useState } from 'react';
import { ArrowLeftRight, Languages, RotateCcw } from 'lucide-react';
import { useTranslateStore } from '../stores/useTranslateStore';
import { SUPPORTED_LANGS, getFlagUrlByLang, getLangLabel } from '../lib/flags';

export default function Translate() {
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('de');
  const [q, setQ] = useState('');

  const translate = useTranslateStore((s) => s.translate);
  const result = useTranslateStore((s) => s.result);
  const loading = useTranslateStore((s) => s.loading);
  const error = useTranslateStore((s) => s.error);
  const reset = useTranslateStore((s) => s.reset);
  const clearError = useTranslateStore((s) => s.clearError);

  const canSubmit = q.trim().length > 0 && source !== target && !loading;

  const swap = () => {
    setSource(target);
    setTarget(source);
    if (result?.target?.text) {
      setQ(result.target.text);
    }
    reset();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    clearError();
    await translate({ q: q.trim(), source, target });
  };

  const provider = result?.provider || 'MyMemory';
  const langs = useMemo(() => SUPPORTED_LANGS.map((l) => l.code), []);

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='inline-flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-sm font-bold text-green-800'>
            <Languages className='h-4 w-4' />
            TRANSLATOR
          </div>
          <h1 className='mt-3 text-2xl font-extrabold text-gray-900'>
            Translate text instantly
          </h1>
          <p className='mt-1 text-sm text-gray-600'>
            Choose source and target languages, enter text, and get the
            translation.
          </p>
        </div>

        <button
          type='button'
          onClick={() => {
            setQ('');
            reset();
            clearError();
          }}
          className='inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50'
        >
          <RotateCcw className='h-4 w-4' />
          Reset
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5'
      >
        {/* Language row */}
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <LangSelect
            label='Source language'
            value={source}
            onChange={setSource}
            langs={langs}
          />

          <button
            type='button'
            onClick={swap}
            className='mx-auto inline-flex items-center justify-center rounded-2xl bg-green-50 p-3 text-green-700 ring-1 ring-green-100 hover:bg-green-100 md:mx-0'
            title='Swap languages'
          >
            <ArrowLeftRight className='h-5 w-5' />
          </button>

          <LangSelect
            label='Target language'
            value={target}
            onChange={setTarget}
            langs={langs}
          />
        </div>

        {/* Input */}
        <div className='mt-4'>
          <label className='text-sm font-bold text-gray-800'>Text</label>
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={4}
            maxLength={2000}
            className='mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-green-300 focus:ring-2 focus:ring-green-100'
            placeholder='Type a sentence to translate...'
          />
          <div className='mt-1 text-xs text-gray-500'>
            {q.length}/2000 characters
          </div>
        </div>

        {/* Actions */}
        <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <button
            type='submit'
            disabled={!canSubmit}
            className='inline-flex items-center justify-center rounded-2xl bg-green-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60'
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>

          {error && (
            <div className='rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100'>
              {error}
            </div>
          )}
        </div>
      </form>

      {/* Result */}
      <div className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-extrabold text-gray-900'>Result</h2>
          <div className='text-xs font-bold text-gray-500'>
            Provider: {provider}
          </div>
        </div>

        {!result ? (
          <p className='mt-3 text-sm text-gray-600'>
            Your translation will appear here after you submit the request.
          </p>
        ) : (
          <div className='mt-4 grid gap-4 md:grid-cols-2'>
            <ResultCard
              title='Source'
              lang={result.source?.lang}
              text={result.source?.text}
            />
            <ResultCard
              title='Translation'
              lang={result.target?.lang}
              text={result.target?.text}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function LangSelect({ label, value, onChange, langs }) {
  return (
    <div className='w-full'>
      <div className='text-sm font-bold text-gray-800'>{label}</div>
      <div className='mt-2 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2'>
        <img
          src={getFlagUrlByLang(value, 40)}
          alt={value}
          className='h-6 w-8 rounded-md object-cover'
          loading='lazy'
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='w-full bg-transparent text-sm font-bold text-gray-900 outline-none'
        >
          {langs.map((code) => (
            <option key={code} value={code}>
              {getLangLabel(code)} ({code.toUpperCase()})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ResultCard({ title, lang, text }) {
  return (
    <div className='rounded-2xl border border-black/5 bg-gray-50 p-4'>
      <div className='flex items-center justify-between'>
        <div className='text-sm font-extrabold text-gray-900'>{title}</div>
        <div className='flex items-center gap-2 text-xs font-bold text-gray-600'>
          <img
            src={getFlagUrlByLang(lang, 40)}
            alt={lang}
            className='h-5 w-7 rounded-md object-cover'
            loading='lazy'
          />
          {getLangLabel(lang)} ({String(lang || '').toUpperCase()})
        </div>
      </div>

      <div className='mt-3 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm text-gray-800 ring-1 ring-black/5'>
        {text || '—'}
      </div>
    </div>
  );
}

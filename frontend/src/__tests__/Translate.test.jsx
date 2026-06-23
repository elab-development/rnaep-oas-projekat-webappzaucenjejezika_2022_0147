import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Translate from '../pages/Translate';

// ---------------- MOCK FLAGS ----------------
vi.mock('../lib/flags', () => {
  const SUPPORTED_LANGS = [{ code: 'en' }, { code: 'de' }, { code: 'fr' }];
  return {
    SUPPORTED_LANGS,
    getFlagUrlByLang: (lang, size = 40) =>
      `https://flags.test/${lang}-${size}.png`,
    getLangLabel: (lang) =>
      ({ en: 'English', de: 'German', fr: 'French' })[lang] ||
      String(lang).toUpperCase(),
  };
});

// ---------------- MOCK ZUSTAND STORE ----------------
const translateMock = vi.fn();
const resetMock = vi.fn();
const clearErrorMock = vi.fn();

let storeState = {
  result: null,
  loading: false,
  error: null,
  translate: translateMock,
  reset: resetMock,
  clearError: clearErrorMock,
};

vi.mock('../stores/useTranslateStore', () => ({
  useTranslateStore: (selector) => selector(storeState),
}));

function renderPage() {
  return render(<Translate />);
}

describe('Translate page', () => {
  beforeEach(() => {
    translateMock.mockReset();
    resetMock.mockReset();
    clearErrorMock.mockReset();

    storeState = {
      result: null,
      loading: false,
      error: null,
      translate: translateMock,
      reset: resetMock,
      clearError: clearErrorMock,
    };
  });

  it('renders header and initial empty result state', () => {
    renderPage();

    expect(screen.getByText('TRANSLATOR')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Translate text instantly/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Your translation will appear here after you submit the request/i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByText(/Provider:\s*MyMemory/i)).toBeInTheDocument();
  });

  it('Translate button is disabled when textarea is empty', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: /Translate/i });
    expect(btn).toBeDisabled();
  });

  it('enables Translate button when text is typed and source != target', async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText(
      /Type a sentence to translate/i,
    );
    await userEvent.type(textarea, 'Hello');

    const btn = screen.getByRole('button', { name: /Translate/i });
    expect(btn).toBeEnabled();
  });

  it('calls store.translate with correct params on submit', async () => {
    translateMock.mockResolvedValue({
      source: { lang: 'en', text: 'Hello' },
      target: { lang: 'de', text: 'Hallo' },
      provider: 'MyMemory',
    });

    renderPage();

    const textarea = screen.getByPlaceholderText(
      /Type a sentence to translate/i,
    );
    await userEvent.type(textarea, 'Hello');

    await userEvent.click(screen.getByRole('button', { name: /Translate/i }));

    expect(clearErrorMock).toHaveBeenCalledTimes(1);

    expect(translateMock).toHaveBeenCalledTimes(1);
    expect(translateMock).toHaveBeenCalledWith({
      q: 'Hello',
      source: 'en',
      target: 'de',
    });
  });

  it('shows loading label when loading=true', () => {
    storeState.loading = true;
    renderPage();

    const btn = screen.getByRole('button', { name: /Translating/i });
    expect(btn).toBeDisabled();
  });

  it('renders error box when error exists', () => {
    storeState.error = 'Something went wrong';
    renderPage();

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders result cards when result exists', () => {
    storeState.result = {
      source: { lang: 'en', text: 'Hello' },
      target: { lang: 'de', text: 'Hallo' },
      provider: 'MyMemory',
    };

    renderPage();

    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Translation')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hallo')).toBeInTheDocument();

    expect(screen.getByText(/Provider:\s*MyMemory/i)).toBeInTheDocument();

    expect(
      screen
        .getAllByRole('img')
        .some((img) => img.getAttribute('src')?.includes('flags.test')),
    ).toBe(true);
  });

  it('Reset button clears input and calls reset + clearError', async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText(
      /Type a sentence to translate/i,
    );
    await userEvent.type(textarea, 'Hello');

    await userEvent.click(screen.getByRole('button', { name: /Reset/i }));

    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(clearErrorMock).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('');
  });

  it('Swap languages swaps source and target and calls reset', async () => {
    renderPage();

    const selects = screen.getAllByRole('combobox');
    const sourceSelect = selects[0];
    const targetSelect = selects[1];

    // initial state
    expect(sourceSelect.value).toBe('en');
    expect(targetSelect.value).toBe('de');

    await userEvent.click(screen.getByTitle(/Swap languages/i));

    expect(resetMock).toHaveBeenCalledTimes(1);

    // after swap
    expect(sourceSelect.value).toBe('de');
    expect(targetSelect.value).toBe('en');
  });

  it('Swap copies previous translation target text into textarea when result exists', async () => {
    storeState.result = {
      source: { lang: 'en', text: 'Hello' },
      target: { lang: 'de', text: 'Hallo' },
      provider: 'MyMemory',
    };

    renderPage();

    const textarea = screen.getByPlaceholderText(
      /Type a sentence to translate/i,
    );

    expect(textarea).toHaveValue('');

    await userEvent.click(screen.getByTitle(/Swap languages/i));

    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('Hallo');
  });

  it('disables Translate when source === target', async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText(
      /Type a sentence to translate/i,
    );
    await userEvent.type(textarea, 'Hello');

    const selects = screen.getAllByRole('combobox');
    const targetSelect = selects[1];

    fireEvent.change(targetSelect, { target: { value: 'en' } });

    const btn = screen.getByRole('button', { name: /Translate/i });
    expect(btn).toBeDisabled();
  });
});

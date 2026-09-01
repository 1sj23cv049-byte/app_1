'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dictionaries, t as translate } from './dictionaries';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('civilverify_lang');
      if (stored && dictionaries[stored]) setLangState(stored);
    } catch {
      /* localStorage unavailable — default to English */
    }
  }, []);

  const setLang = useCallback((code) => {
    setLangState(code);
    try {
      window.localStorage.setItem('civilverify_lang', code);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key) => translate(lang, key), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

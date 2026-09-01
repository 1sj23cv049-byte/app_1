'use client';

import { useI18n } from '../lib/i18n/I18nProvider';
import { LANGUAGES } from '../lib/i18n/dictionaries';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className="rounded-lg border border-clay-200 bg-white px-2 py-1.5 text-sm text-ink"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

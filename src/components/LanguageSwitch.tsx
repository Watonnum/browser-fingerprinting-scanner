'use client';

import type { Locale } from '@/lib/i18n';

interface LanguageSwitchProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'th', label: 'TH' },
];

export function LanguageSwitch({ locale, onChange }: LanguageSwitchProps) {
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-lg border border-slate-800 bg-slate-900/70 p-0.5">
      {OPTIONS.map((option) => {
        const active = option.value === locale;
        return (
          <button
            key={option.value}
            id={`lang-${option.value}`}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { Globe } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

interface LanguageSwitchProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function LanguageSwitch({ currentLocale, onLocaleChange }: LanguageSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Language selector"
      className="inline-flex items-center rounded-xl border border-slate-800/90 bg-slate-900/80 p-1 shadow-inner shadow-black/40 backdrop-blur-md"
    >
      <div className="flex items-center gap-1.5 pl-2 pr-1.5 text-slate-500">
        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <button
        type="button"
        onClick={() => onLocaleChange('en')}
        aria-pressed={currentLocale === 'en'}
        className={`relative cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition-all ${
          currentLocale === 'en'
            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onLocaleChange('th')}
        aria-pressed={currentLocale === 'th'}
        className={`relative cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition-all ${
          currentLocale === 'th'
            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        TH
      </button>
    </div>
  );
}

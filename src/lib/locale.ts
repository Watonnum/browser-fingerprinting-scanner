'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { Locale } from './i18n';

const STORAGE_KEY = 'cyberscan_locale';
const CHANGE_EVENT = 'cyberscan:locale';
const DEFAULT_LOCALE: Locale = 'th';

function readLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'th' ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function serverLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function useLocale(): [Locale, (next: Locale) => void] {
  const locale = useSyncExternalStore(subscribe, readLocale, serverLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    } finally {
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  }, []);

  return [locale, setLocale];
}

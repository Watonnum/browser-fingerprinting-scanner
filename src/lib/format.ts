import type { Locale } from './i18n';

const numberFormatter = new Intl.NumberFormat('en-US');

function intlTag(locale: Locale): string {
  return locale === 'th' ? 'th-TH' : 'en-US';
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatBits(bits: number): string {
  return bits.toFixed(2);
}

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

export function formatDateTime(iso: string | null, locale: Locale = 'en'): string {
  if (!iso) {
    return '\u2014';
  }
  return new Intl.DateTimeFormat(intlTag(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function formatRelative(iso: string | null, locale: Locale = 'en'): string {
  if (!iso) {
    return '\u2014';
  }
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return formatter.format(0, 'second');
}

export function formatOneIn(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return formatNumber(Math.round(value / 100_000) * 100_000);
  }
  return formatNumber(Math.max(1, Math.round(value)));
}

export function truncateMiddle(value: string, head = 10, tail = 8): string {
  if (value.length <= head + tail + 1) {
    return value;
  }
  return `${value.slice(0, head)}\u2026${value.slice(-tail)}`;
}

import type { EnvData } from '@/types/fingerprint';

type ExtendedNavigator = Navigator & {
  deviceMemory?: number;
  msDoNotTrack?: string;
};

type ExtendedWindow = Window & {
  doNotTrack?: string;
};

function resolveTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function resolveLanguages(nav: Navigator): string[] {
  if (Array.isArray(nav.languages) && nav.languages.length > 0) {
    return [...nav.languages];
  }
  return nav.language ? [nav.language] : [];
}

function resolveDoNotTrack(nav: ExtendedNavigator): string | null {
  const win = window as ExtendedWindow;
  return nav.doNotTrack ?? win.doNotTrack ?? nav.msDoNotTrack ?? null;
}

export async function probeEnv(): Promise<EnvData> {
  const nav = navigator as ExtendedNavigator;
  const scr = window.screen;
  return {
    screenWidth: scr.width,
    screenHeight: scr.height,
    availWidth: scr.availWidth,
    availHeight: scr.availHeight,
    colorDepth: scr.colorDepth,
    pixelRatio: Number((window.devicePixelRatio || 1).toFixed(3)),
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    timezone: resolveTimezone(),
    timezoneOffset: new Date().getTimezoneOffset(),
    languages: resolveLanguages(nav),
    platform: nav.platform || 'Unknown',
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints || 0,
    cookieEnabled: nav.cookieEnabled,
    doNotTrack: resolveDoNotTrack(nav),
  };
}

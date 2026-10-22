import type { ModuleKey, ModuleRisk } from '@/types/fingerprint';
import { indexModules } from './insights';

export type AdvisorFilter = 'all' | 'firefox' | 'brave' | 'chromeSafari';

export type AdvisorId =
  | 'firefoxRfp'
  | 'braveShields'
  | 'uniformBrowser'
  | 'firefoxWebgl'
  | 'firefoxFonts'
  | 'safariAfp'
  | 'chromeBaseline';

export interface AdvisorLink {
  label: string;
  href: string;
}

interface AdvisorSpec {
  id: AdvisorId;
  tag: string;
  filters: AdvisorFilter[];
  coverage: Partial<Record<ModuleKey, number>>;
  code?: string;
  links?: AdvisorLink[];
  requires?: ModuleKey;
  maxProtection?: boolean;
}

export interface AdvisorCard {
  id: AdvisorId;
  tag: string;
  filters: AdvisorFilter[];
  code?: string;
  links?: AdvisorLink[];
  reductionBits: number;
  maxProtection: boolean;
  recommended: boolean;
}

const SPECS: AdvisorSpec[] = [
  {
    id: 'firefoxRfp',
    tag: 'Firefox / LibreWolf',
    filters: ['firefox'],
    coverage: { canvas: 1, audio: 0.8, fonts: 0.8, env: 0.7, webgl: 0.6 },
    code: 'privacy.resistFingerprinting = true',
  },
  {
    id: 'braveShields',
    tag: 'Brave Shields',
    filters: ['brave'],
    coverage: { canvas: 1, audio: 1, webgl: 0.5, fonts: 0.6, env: 0.3 },
    code: 'brave://settings/shields',
  },
  {
    id: 'uniformBrowser',
    tag: 'Mullvad / Tor Browser',
    filters: ['firefox', 'brave', 'chromeSafari'],
    coverage: { canvas: 1, audio: 1, webgl: 1, fonts: 1, env: 1 },
    links: [
      { label: 'Mullvad Browser', href: 'https://mullvad.net/browser' },
      { label: 'Tor Project', href: 'https://www.torproject.org/download/' },
    ],
    maxProtection: true,
  },
  {
    id: 'firefoxWebgl',
    tag: 'Firefox',
    filters: ['firefox'],
    coverage: { webgl: 1 },
    code: 'webgl.disabled = true',
    requires: 'webgl',
  },
  {
    id: 'firefoxFonts',
    tag: 'Firefox',
    filters: ['firefox'],
    coverage: { fonts: 0.9 },
    code: 'layout.css.font-visibility.level = 1',
    requires: 'fonts',
  },
  {
    id: 'safariAfp',
    tag: 'Safari 17+',
    filters: ['chromeSafari'],
    coverage: { canvas: 0.9, audio: 0.9, fonts: 0.5, webgl: 0.3 },
    code: 'Settings \u2192 Advanced \u2192 All browsing',
  },
  {
    id: 'chromeBaseline',
    tag: 'Chrome / Edge',
    filters: ['chromeSafari'],
    coverage: { env: 0.3, fonts: 0.2 },
    code: 'chrome://settings/languages',
  },
];

const MIN_USEFUL_BITS = 0.5;

export function buildAdvisor(modules: ModuleRisk[]): AdvisorCard[] {
  const byModule = indexModules(modules);
  const cards = SPECS.filter((spec) => !spec.requires || byModule[spec.requires]?.riskLevel !== 'Safe')
    .map((spec) => {
      const reductionBits = Object.entries(spec.coverage).reduce((total, [key, factor]) => {
        const mod = byModule[key as ModuleKey];
        return total + (mod ? mod.entropyBits * (factor ?? 0) : 0);
      }, 0);
      return {
        id: spec.id,
        tag: spec.tag,
        filters: spec.filters,
        code: spec.code,
        links: spec.links,
        reductionBits: Math.round(reductionBits * 100) / 100,
        maxProtection: Boolean(spec.maxProtection),
        recommended: false,
      };
    })
    .filter((card) => card.maxProtection || card.reductionBits >= MIN_USEFUL_BITS)
    .sort((a, b) => Number(a.maxProtection) - Number(b.maxProtection) || b.reductionBits - a.reductionBits);

  const top = cards.find((card) => !card.maxProtection);
  if (top) {
    top.recommended = true;
  }
  return cards;
}

import type { EnvData, FontData, ModuleKey, ModuleRisk, RiskLevel } from '@/types/fingerprint';
import { FONT_PREVALENCE } from '@/lib/entropy/calculator';
import { FONT_GROUPS } from '@/lib/probes/fontProbe';

const RISK_RANK: Record<RiskLevel, number> = { Safe: 0, Standard: 1, 'High Risk': 2 };

export function worstRisk(levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>((worst, level) => (RISK_RANK[level] > RISK_RANK[worst] ? level : worst), 'Safe');
}

export function indexModules(modules: ModuleRisk[]): Partial<Record<ModuleKey, ModuleRisk>> {
  return modules.reduce<Partial<Record<ModuleKey, ModuleRisk>>>((acc, module) => {
    acc[module.module] = module;
    return acc;
  }, {});
}

const GPU_VENDOR = /(apple|nvidia|geforce|radeon|amd|intel|adreno|mali|powervr|qualcomm)/i;

export function gpuShortName(renderer: string): string {
  const inner = renderer.match(/^ANGLE \((.*)\)$/)?.[1] ?? renderer;
  const parts = inner.split(',').map((part) => part.trim()).filter(Boolean);
  const candidate =
    parts.find((part) => GPU_VENDOR.test(part) && /\d/.test(part)) ?? parts[1] ?? parts[0] ?? renderer;
  const cleaned = candidate
    .replace(/ANGLE Metal Renderer:\s*/i, '')
    .replace(/\((TM|R)\)/gi, '')
    .replace(/\(0x[0-9a-f]+\)/gi, '')
    .replace(/Direct3D.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 40 ? `${cleaned.slice(0, 39)}\u2026` : cleaned || renderer;
}

export function osName(env: EnvData): string {
  const source = `${env.platform} ${env.userAgent}`;
  if (/iPhone|iPad|iPod/i.test(source)) return 'iOS';
  if (/Android/i.test(env.userAgent)) return 'Android';
  if (/Mac/i.test(env.platform)) return 'macOS';
  if (/Win/i.test(env.platform)) return 'Windows';
  if (/CrOS/i.test(env.userAgent)) return 'ChromeOS';
  if (/Linux/i.test(source)) return 'Linux';
  return env.platform || 'Unknown';
}

export function utcOffset(minutes: number): string {
  const sign = minutes <= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const mins = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${mins}`;
}

export function rareFonts(fonts: FontData): string[] {
  return fonts.detected.filter((font) => (FONT_PREVALENCE[font] ?? 0.1) < 0.1);
}

export function dominantFontFamily(fonts: FontData): string | null {
  const detected = new Set(fonts.detected);
  let best: string | null = null;
  let bestRatio = 0;
  for (const [family, members] of Object.entries(FONT_GROUPS)) {
    const ratio = members.filter((font) => detected.has(font)).length / members.length;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = family;
    }
  }
  return bestRatio >= 0.5 ? best : null;
}

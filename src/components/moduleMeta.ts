import { AudioWaveform, Cpu, Monitor, Palette, Type } from 'lucide-react';
import type { ModuleKey } from '@/types/fingerprint';

export type IconComponent = typeof Cpu;

export interface ModuleMeta {
  title: string;
  short: string;
  accent: string;
  icon: IconComponent;
}

export const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  canvas: { title: 'Canvas Fingerprint', short: 'Canvas', accent: '#e879f9', icon: Palette },
  webgl: { title: 'WebGL / GPU', short: 'WebGL', accent: '#22d3ee', icon: Cpu },
  audio: { title: 'AudioContext', short: 'Audio', accent: '#a78bfa', icon: AudioWaveform },
  env: { title: 'System Environment', short: 'Environment', accent: '#60a5fa', icon: Monitor },
  fonts: { title: 'Installed Fonts', short: 'Fonts', accent: '#bef264', icon: Type },
};

export const MODULE_ORDER: ModuleKey[] = ['canvas', 'webgl', 'audio', 'env', 'fonts'];

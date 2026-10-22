'use client';

import Image from 'next/image';
import { AudioWaveform, ChevronDown, Monitor, Palette } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { EntropySignal, FingerprintPayload, ModuleRisk, RiskLevel } from '@/types/fingerprint';
import { formatNumber, formatOneIn, truncateMiddle } from '@/lib/format';
import type { Dict } from '@/lib/i18n';
import { dominantFontFamily, gpuShortName, osName, rareFonts, utcOffset, worstRisk } from '@/lib/insights';
import { useLazyVisibility } from './LazySection';
import type { IconComponent } from './moduleMeta';
import { BitsBadge, CopyButton, TONE } from './ui';

interface CardShellProps {
  icon: IconComponent;
  accent: string;
  title: string;
  subtitle: string;
  modules: ModuleRisk[];
  takeaway: string;
  inspector: Array<[string, string]>;
  t: Dict;
  children: ReactNode;
}

function SignalBars({ signals, accent }: { signals: EntropySignal[]; accent: string }) {
  const visible = useLazyVisibility();
  const max = Math.max(1, ...signals.map((signal) => signal.entropyBits));
  return (
    <ul className="space-y-1.5">
      {signals.map((signal) => (
        <li key={signal.name} className="flex items-center gap-2 text-[11px]">
          <span className="w-32 shrink-0 truncate text-slate-400" title={`${signal.name}: ${signal.value}`}>
            {signal.name}
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <span
              className="block h-full origin-left rounded-full transition-transform duration-700 ease-out"
              style={{
                width: `${Math.max(3, (signal.entropyBits / max) * 100)}%`,
                background: accent,
                transform: `scaleX(${visible ? 1 : 0})`,
              }}
            />
          </span>
          <span className="w-10 text-right font-mono text-slate-400 tabular-nums">{signal.entropyBits.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

function CardShell({ icon: Icon, accent, title, subtitle, modules, takeaway, inspector, t, children }: CardShellProps) {
  const risk: RiskLevel = worstRisk(modules.map((module) => module.riskLevel));
  const bits = modules.reduce((total, module) => total + module.entropyBits, 0);
  const signals = modules.flatMap((module) => module.signals);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40">
      <header className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border"
            style={{ color: accent, borderColor: `${accent}40`, background: `${accent}14` }}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-100">{title}</h3>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <BitsBadge bits={bits} risk={risk} />
      </header>

      <div className="flex-1 space-y-4 px-5">{children}</div>

      <p className={`mx-5 mt-4 text-xs leading-relaxed font-medium ${TONE[risk].strong}`}>{takeaway}</p>

      <details className="group mx-5 mt-3 mb-5 rounded-xl border border-slate-800/80 bg-slate-950/40">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-slate-400 transition-colors hover:text-slate-200 [&::-webkit-details-marker]:hidden">
          {t.cards.inspector}
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-4 border-t border-slate-800/80 px-3 py-3">
          <dl className="space-y-1.5">
            {inspector.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-[11px]">
                <dt className="shrink-0 text-slate-500">{label}</dt>
                <dd className="min-w-0 truncate text-right font-mono text-slate-300" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          {signals.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">{t.cards.signals}</p>
              <SignalBars signals={signals} accent={accent} />
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}

function Row({ label, value, valueClass = 'text-slate-200' }: { label: string; value: ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-800/60 py-2 text-xs last:border-b-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`min-w-0 truncate text-right font-mono ${valueClass}`}>{value}</span>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-300">{children}</div>
  );
}

interface CardProps {
  payload: FingerprintPayload;
  modules: Partial<Record<ModuleRisk['module'], ModuleRisk>>;
  t: Dict;
}

function pick(modules: CardProps['modules'], keys: Array<ModuleRisk['module']>): ModuleRisk[] {
  return keys.map((key) => modules[key]).filter((module): module is ModuleRisk => Boolean(module));
}

export function GpuCard({ payload, modules, t }: CardProps) {
  const { canvas, webgl } = payload;
  const c = t.cards.gpu;
  const exposed = webgl.supported && webgl.unmaskedRenderer !== 'Masked';
  const gpu = exposed ? gpuShortName(webgl.unmaskedRenderer) : c.masked;

  let takeaway = t.takeaway.gpuMasked;
  if (!canvas.supported && !webgl.supported) takeaway = t.takeaway.gpuBlocked;
  else if (canvas.supported && !canvas.stable) takeaway = t.takeaway.gpuRandomized;
  else if (exposed) takeaway = t.takeaway.gpuExposed(gpu);

  return (
    <CardShell
      icon={Palette}
      accent="#e879f9"
      title={c.title}
      subtitle={c.subtitle}
      modules={pick(modules, ['canvas', 'webgl'])}
      takeaway={takeaway}
      t={t}
      inspector={[
        ['Canvas SHA-256', canvas.hash || 'n/a'],
        ['Canvas data URL', `${formatNumber(canvas.dataLength)} chars`],
        ['Even-odd winding', canvas.winding ? 'yes' : 'no'],
        ['WebGL vendor', webgl.unmaskedVendor],
        ['WebGL renderer', webgl.unmaskedRenderer],
        ['GLSL', webgl.shadingLanguageVersion],
        ['Extensions', String(webgl.extensionsCount)],
        ['Max viewport', webgl.maxViewportDims.join(' \u00d7 ') || 'n/a'],
        ['Max renderbuffer', formatNumber(webgl.maxRenderbufferSize)],
        ['Parameter hash', webgl.parameterHash || 'n/a'],
      ]}
    >
      {canvas.supported && canvas.dataUrl ? (
        <figure className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          <Image
            src={canvas.dataUrl}
            alt="Canvas rendering produced by your browser"
            width={canvas.width}
            height={canvas.height}
            unoptimized
            className="h-auto w-full"
          />
          <figcaption className="flex items-center justify-between gap-3 border-t border-slate-800 px-3 py-2 text-[11px]">
            <span className="truncate font-mono text-slate-500">SHA-256: {truncateMiddle(canvas.hash, 6, 6)}</span>
            <span className={canvas.stable ? 'text-rose-400' : 'text-emerald-400'}>
              {canvas.stable ? c.canvasStable : c.canvasNoisy}
            </span>
          </figcaption>
        </figure>
      ) : (
        <Notice>{c.canvasBlocked}</Notice>
      )}

      {webgl.supported ? (
        <div>
          <Row label={c.renderer} value={gpu} valueClass={exposed ? 'text-slate-100' : 'text-emerald-300'} />
          <Row label={c.webgl} value={webgl.version.replace(/\s*\(.*\)$/, '')} />
          <Row label={c.maxTexture} value={`${formatNumber(webgl.maxTextureSize)} \u00d7 ${formatNumber(webgl.maxTextureSize)} px`} />
          <Row
            label={c.antialias}
            value={webgl.antialias ? c.on : c.off}
            valueClass={webgl.antialias ? 'text-emerald-400' : 'text-slate-400'}
          />
        </div>
      ) : (
        <Notice>{c.webglBlocked}</Notice>
      )}
    </CardShell>
  );
}

function Tile({ label, value, sub, extra }: { label: string; value: string; sub?: string; extra?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
      <p className="truncate text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-100" title={value}>
        {value}
        {extra ? <span className="ml-1 text-xs font-medium text-cyan-400">{extra}</span> : null}
      </p>
      {sub ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function EnvCard({ payload, modules, t }: CardProps) {
  const { env } = payload;
  const c = t.cards.env;
  const envModules = pick(modules, ['env']);
  const envBits = envModules.reduce((total, module) => total + module.entropyBits, 0);
  const memory = env.deviceMemory === null ? null : `${env.deviceMemory} GB`;
  const os = osName(env);

  return (
    <CardShell
      icon={Monitor}
      accent="#22d3ee"
      title={c.title}
      subtitle={c.subtitle}
      modules={envModules}
      takeaway={t.takeaway.env(formatOneIn(Math.pow(2, envBits)))}
      t={t}
      inspector={[
        ['Available size', `${env.availWidth} \u00d7 ${env.availHeight}`],
        ['Device pixel ratio', String(env.pixelRatio)],
        ['Timezone offset', `${env.timezoneOffset} min`],
        ['Platform', env.platform],
        ['Cookies enabled', String(env.cookieEnabled)],
        ['Do Not Track', env.doNotTrack ?? 'unset'],
        ['Languages', env.languages.join(', ') || 'n/a'],
      ]}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Tile
          label={c.screen}
          value={`${env.screenWidth} \u00d7 ${env.screenHeight}`}
          extra={`(${env.pixelRatio}x)`}
          sub={c.colorDepth(env.colorDepth)}
        />
        <Tile
          label={c.hardware}
          value={`${env.hardwareConcurrency || '?'} Cores${memory ? ` \u2022 ${memory}` : ''}`}
          sub={memory ? c.ramNote : c.ramHidden}
        />
        <Tile label={c.timezone} value={env.timezone} sub={utcOffset(env.timezoneOffset)} />
        <Tile label={c.os} value={`${os} (${env.platform})`} sub={c.dnt(env.doNotTrack === '1')} />
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-slate-400">{c.userAgent}</p>
          <CopyButton value={env.userAgent} label={t.copy} copiedLabel={t.copied} />
        </div>
        <p className="font-mono text-[11px] leading-relaxed break-all text-slate-300">{env.userAgent}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">
          {c.languages}: <span className="font-medium text-slate-200">{env.languages.join(', ') || 'n/a'}</span>
        </span>
        <span className="text-emerald-400">{c.touch(env.maxTouchPoints)}</span>
      </div>
    </CardShell>
  );
}

function Equalizer({ samples }: { samples: number[] }) {
  const visible = useLazyVisibility();
  const bars = samples.filter((_, index) => index % 3 === 0).slice(0, 32);
  const magnitudes = bars.map((sample) => Math.abs(sample));
  const min = Math.min(...magnitudes);
  const span = Math.max(...magnitudes) - min || 1;

  return (
    <div className="flex h-14 items-end gap-[3px]" aria-hidden="true">
      {magnitudes.map((magnitude, index) => (
        <span
          key={index}
          className="flex-1 origin-bottom rounded-sm bg-linear-to-t from-violet-600/70 to-violet-300 transition-transform duration-700 ease-out"
          style={{
            height: `${18 + ((magnitude - min) / span) * 82}%`,
            transform: `scaleY(${visible ? 1 : 0.08})`,
            transitionDelay: `${index * 18}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function AudioFontsCard({ payload, modules, t }: CardProps) {
  const { audio, fonts } = payload;
  const c = t.cards.audioFonts;
  const [showMissing, setShowMissing] = useState(false);
  const detected = new Set(fonts.detected);
  const missing = fonts.tested.filter((font) => !detected.has(font));
  const rare = rareFonts(fonts);
  const rareSet = new Set(rare);
  const family = dominantFontFamily(fonts);

  let takeaway = t.takeaway.fontsGeneric;
  if (fonts.detectedCount === 0) takeaway = t.takeaway.fontsNone;
  else if (rare.length > 0) takeaway = t.takeaway.fontsRare(rare.join(', '));
  else if (family) takeaway = t.takeaway.fontsFamily(family);

  return (
    <CardShell
      icon={AudioWaveform}
      accent="#a78bfa"
      title={c.title}
      subtitle={c.subtitle}
      modules={pick(modules, ['audio', 'fonts'])}
      takeaway={takeaway}
      t={t}
      inspector={[
        ['Sample sum', audio.supported ? audio.sampleSum.toFixed(12) : 'n/a'],
        ['Audio SHA-256', audio.hash || 'n/a'],
        ['Sample rate', `${formatNumber(audio.sampleRate)} Hz \u00b7 ${formatNumber(audio.frames)} frames`],
        ['Font set SHA-256', fonts.hash || 'n/a'],
        ['Fonts not found', missing.join(', ') || 'none'],
      ]}
    >
      {audio.supported ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
            <span className="truncate text-slate-400">{c.oscillator}</span>
            <span className="shrink-0 font-mono text-violet-300">{audio.sampleSum.toFixed(10)}</span>
          </div>
          <Equalizer samples={audio.samplePreview} />
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
            <span className="truncate font-mono text-slate-500">DSP: {truncateMiddle(audio.hash, 6, 6)}</span>
            <span className={audio.stable ? 'text-rose-400' : 'text-emerald-400'}>{audio.stable ? c.stable : c.noisy}</span>
          </div>
        </div>
      ) : (
        <Notice>{c.audioBlocked}</Notice>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">{c.fontsDetected}</span>
          <span className="font-mono text-violet-300">{c.fontsCount(fonts.detectedCount, fonts.tested.length)}</span>
        </div>
        {fonts.detectedCount === 0 ? (
          <Notice>{c.noFonts}</Notice>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {fonts.detected.map((font) => (
              <li
                key={font}
                className={`rounded-md border px-2 py-0.5 text-[11px] ${
                  rareSet.has(font)
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                    : 'border-slate-700/80 bg-slate-800/50 text-slate-300'
                }`}
                style={{ fontFamily: `'${font}', sans-serif` }}
              >
                {font}
              </li>
            ))}
            {showMissing
              ? missing.map((font) => (
                  <li
                    key={font}
                    className="rounded-md border border-slate-800 px-2 py-0.5 text-[11px] text-slate-600 line-through"
                  >
                    {font}
                  </li>
                ))
              : null}
          </ul>
        )}
        {missing.length > 0 && fonts.detectedCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowMissing((value) => !value)}
            className="mt-2 cursor-pointer text-[11px] text-slate-500 transition-colors hover:text-slate-300"
          >
            {showMissing ? c.hideMissing : c.showMissing(missing.length)}
          </button>
        ) : null}
      </div>
    </CardShell>
  );
}

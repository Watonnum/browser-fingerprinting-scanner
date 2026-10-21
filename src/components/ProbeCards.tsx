import Image from 'next/image';
import { Activity, Binary, Clock, Cpu, Eye, HardDrive, Languages, Layers, Lock, Monitor, Palette, ScanLine } from 'lucide-react';
import type { AudioData, CanvasData, EnvData, FontData, ModuleRisk, WebGLData } from '@/types/fingerprint';
import { FONT_PREVALENCE } from '@/lib/entropy/calculator';
import { formatNumber, truncateMiddle } from '@/lib/format';
import type { TranslationDict } from '@/lib/i18n';
import { FONT_GROUPS } from '@/lib/probes/fontProbe';
import { DataCard } from './DataCard';
import type { IconComponent } from './moduleMeta';
import { CopyButton, DataRow, StatusPill } from './ui';

function BlockedNotice({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
      <Lock className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
      {message}
    </div>
  );
}

function HashValue({ value, copyLabel = 'Copy hash' }: { value: string; copyLabel?: string }) {
  if (!value) {
    return <span className="text-slate-500">n/a</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span title={value} className="font-mono text-cyan-300">
        {truncateMiddle(value, 10, 6)}
      </span>
      <CopyButton value={value} label={copyLabel} />
    </span>
  );
}

interface CanvasCardProps {
  data: CanvasData;
  dataUrl: string;
  risk: ModuleRisk;
  delayMs?: number;
  i18n: TranslationDict['probesSection'];
  riskBadgeLabel?: string;
  copyLabel?: string;
}

export function CanvasCard({ data, dataUrl, risk, delayMs, i18n, riskBadgeLabel, copyLabel }: CanvasCardProps) {
  const t = i18n.modules.canvas;
  return (
    <DataCard
      risk={risk}
      titleOverride={t.title}
      subtitle={t.subtitle}
      entropyLabel={i18n.entropyLabel}
      weightLabel={i18n.weight}
      riskBadgeLabel={riskBadgeLabel}
      emptySignalsLabel={i18n.signalsEmpty}
      averageMarkerLabel={i18n.averageMarker}
      delayMs={delayMs}
    >
      {data.supported && dataUrl ? (
        <div className="checkerboard relative mb-4 overflow-hidden rounded-xl ring-1 ring-slate-800">
          <Image
            src={dataUrl}
            alt="Canvas fingerprint render produced by your browser"
            width={data.width}
            height={data.height}
            unoptimized
            className="h-auto w-full"
          />
          <span className="absolute right-2 bottom-2 rounded-md bg-slate-950/85 px-2 py-0.5 font-mono text-[10px] font-medium text-fuchsia-300 ring-1 ring-fuchsia-500/30">
            {data.width}×{data.height} · PNG
          </span>
        </div>
      ) : (
        <div className="mb-4">
          <BlockedNotice message="Canvas readback returned no image data. Fingerprinting via canvas is blocked." />
        </div>
      )}
      <dl>
        <DataRow label="SHA-256" value={<HashValue value={data.hash} copyLabel={copyLabel} />} mono />
        <DataRow label={t.dataUrlSize} value={`${formatNumber(data.dataLength)} chars`} mono />
        <DataRow
          label={t.stability}
          value={<StatusPill ok={!data.stable} okText={t.randomized} badText={t.deterministic} />}
        />
        <DataRow label={t.winding} value={data.winding ? t.supported : t.unsupported} />
        <DataRow
          label={t.preview}
          value={<span className="text-slate-400">{data.preview ? `${data.preview.slice(0, 36)}\u2026` : 'n/a'}</span>}
          mono
          title={data.preview}
        />
      </dl>
    </DataCard>
  );
}

interface WebGLCardProps {
  data: WebGLData;
  risk: ModuleRisk;
  delayMs?: number;
  i18n: TranslationDict['probesSection'];
  riskBadgeLabel?: string;
  copyLabel?: string;
}

export function WebGLCard({ data, risk, delayMs, i18n, riskBadgeLabel, copyLabel }: WebGLCardProps) {
  const t = i18n.modules.webgl;
  return (
    <DataCard
      risk={risk}
      titleOverride={t.title}
      subtitle={t.subtitle}
      entropyLabel={i18n.entropyLabel}
      weightLabel={i18n.weight}
      riskBadgeLabel={riskBadgeLabel}
      emptySignalsLabel={i18n.signalsEmpty}
      averageMarkerLabel={i18n.averageMarker}
      delayMs={delayMs}
    >
      {data.supported ? (
        <>
          <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-4">
            <p className="text-[11px] font-semibold tracking-wider text-cyan-400/90 uppercase">{t.unmaskedRenderer}</p>
            <p className="mt-1 font-mono text-sm leading-snug break-words text-cyan-100">{data.unmaskedRenderer}</p>
            <p className="mt-2 text-xs text-slate-400">
              {t.vendor}: <span className="text-slate-200">{data.unmaskedVendor}</span>
            </p>
          </div>
          <dl>
            <DataRow label={t.context} value={data.contextVersion.toUpperCase()} mono />
            <DataRow label={t.version} value={data.version} mono title={data.version} />
            <DataRow label={t.glsl} value={data.shadingLanguageVersion} mono />
            <DataRow label={t.extensions} value={formatNumber(data.extensionsCount)} mono highlight />
            <DataRow label={t.maxTexture} value={`${formatNumber(data.maxTextureSize)} px`} mono />
            <DataRow
              label={t.maxViewport}
              value={data.maxViewportDims.length === 2 ? `${data.maxViewportDims[0]} × ${data.maxViewportDims[1]}` : 'n/a'}
              mono
            />
            <DataRow label={t.renderbuffer} value={`${formatNumber(data.maxRenderbufferSize)} px`} mono />
            <DataRow label={t.antialias} value={data.antialias ? t.enabled : t.disabled} />
            <DataRow label={t.paramHash} value={<HashValue value={data.parameterHash} copyLabel={copyLabel} />} mono />
          </dl>
        </>
      ) : (
        <BlockedNotice message="WebGL is disabled. Your GPU model and driver details are hidden." />
      )}
    </DataCard>
  );
}

function Waveform({ samples }: { samples: number[] }) {
  if (samples.length < 2) {
    return null;
  }
  const width = 320;
  const height = 72;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min || 1;
  const points = samples.map((sample, index) => {
    const x = (index / (samples.length - 1)) * width;
    const y = height - 6 - ((sample - min) / span) * (height - 12);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="waveform-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#waveform-fill)" />
      <path d={line} fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface AudioCardProps {
  data: AudioData;
  risk: ModuleRisk;
  delayMs?: number;
  i18n: TranslationDict['probesSection'];
  riskBadgeLabel?: string;
  copyLabel?: string;
}

export function AudioCard({ data, risk, delayMs, i18n, riskBadgeLabel, copyLabel }: AudioCardProps) {
  const t = i18n.modules.audio;
  const canvasT = i18n.modules.canvas;
  return (
    <DataCard
      risk={risk}
      titleOverride={t.title}
      subtitle={t.subtitle}
      entropyLabel={i18n.entropyLabel}
      weightLabel={i18n.weight}
      riskBadgeLabel={riskBadgeLabel}
      emptySignalsLabel={i18n.signalsEmpty}
      averageMarkerLabel={i18n.averageMarker}
      delayMs={delayMs}
    >
      {data.supported ? (
        <>
          <div className="mb-4 overflow-hidden rounded-xl border border-violet-500/20 bg-violet-950/30 px-3.5 pt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-violet-300/80 uppercase">
              <span>{t.renderedBuffer}</span>
              <span className="font-mono tracking-normal normal-case text-violet-300/70">
                {data.frames} frames @ {formatNumber(data.sampleRate)} Hz
              </span>
            </div>
            <Waveform samples={data.samplePreview} />
          </div>
          <dl>
            <DataRow label={t.sampleSum} value={data.sampleSum.toFixed(10)} mono highlight />
            <DataRow label={t.signature} value={<HashValue value={data.hash} copyLabel={copyLabel} />} mono />
            <DataRow
              label={t.stability}
              value={<StatusPill ok={!data.stable} okText={canvasT.randomized} badText={canvasT.deterministic} />}
            />
          </dl>
        </>
      ) : (
        <BlockedNotice message="OfflineAudioContext is unavailable. No audio DSP signature could be produced." />
      )}
    </DataCard>
  );
}

interface EnvTileProps {
  icon: IconComponent;
  label: string;
  value: string;
  sub?: string;
}

function EnvTile({ icon: Icon, label, value, sub }: EnvTileProps) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 transition-colors hover:border-slate-700">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        <Icon className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1.5 truncate font-mono text-sm text-slate-100" title={value}>
        {value}
      </p>
      {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

interface EnvCardProps {
  data: EnvData;
  risk: ModuleRisk;
  delayMs?: number;
  className?: string;
  i18n: TranslationDict['probesSection'];
  riskBadgeLabel?: string;
  copyLabel?: string;
}

function formatOffset(minutes: number): string {
  const sign = minutes <= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const mins = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${mins}`;
}

export function EnvCard({ data, risk, delayMs, className, i18n, riskBadgeLabel, copyLabel }: EnvCardProps) {
  const t = i18n.modules.env;
  const webglT = i18n.modules.webgl;
  return (
    <DataCard
      risk={risk}
      titleOverride={t.title}
      subtitle={t.subtitle}
      entropyLabel={i18n.entropyLabel}
      weightLabel={i18n.weight}
      riskBadgeLabel={riskBadgeLabel}
      emptySignalsLabel={i18n.signalsEmpty}
      averageMarkerLabel={i18n.averageMarker}
      delayMs={delayMs}
      className={className}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <EnvTile icon={Monitor} label={t.screen} value={`${data.screenWidth} × ${data.screenHeight}`} />
        <EnvTile icon={Layers} label={t.available} value={`${data.availWidth} × ${data.availHeight}`} />
        <EnvTile icon={Palette} label={t.colorDepth} value={`${data.colorDepth}-bit`} />
        <EnvTile icon={ScanLine} label={t.pixelRatio} value={`${data.pixelRatio}×`} />
        <EnvTile icon={Cpu} label={t.cpuThreads} value={String(data.hardwareConcurrency || 'n/a')} />
        <EnvTile
          icon={HardDrive}
          label={t.memory}
          value={data.deviceMemory === null ? 'Hidden' : `${data.deviceMemory} GB`}
          sub={data.deviceMemory === null ? 'n/a' : 'Bucketed'}
        />
        <EnvTile icon={Clock} label={t.timezone} value={data.timezone} sub={formatOffset(data.timezoneOffset)} />
        <EnvTile
          icon={Languages}
          label={t.languages}
          value={data.languages.join(', ') || 'n/a'}
          sub={t.declared(data.languages.length)}
        />
        <EnvTile icon={Binary} label={t.platform} value={data.platform} />
        <EnvTile icon={Activity} label={t.touchPoints} value={String(data.maxTouchPoints)} />
        <EnvTile icon={Eye} label={t.doNotTrack} value={data.doNotTrack === '1' ? webglT.enabled : webglT.disabled} />
        <EnvTile icon={Lock} label={t.cookies} value={data.cookieEnabled ? webglT.enabled : webglT.disabled} />
      </div>
      <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{t.userAgent}</span>
          <CopyButton value={data.userAgent} label={copyLabel} />
        </div>
        <p className="font-mono text-xs leading-relaxed break-all text-slate-300">{data.userAgent}</p>
      </div>
    </DataCard>
  );
}

interface FontsCardProps {
  data: FontData;
  risk: ModuleRisk;
  delayMs?: number;
  i18n: TranslationDict['probesSection'];
  riskBadgeLabel?: string;
}

export function FontsCard({ data, risk, delayMs, i18n, riskBadgeLabel }: FontsCardProps) {
  const t = i18n.modules.fonts;
  const detected = new Set(data.detected);
  const groups = Object.entries(FONT_GROUPS) as Array<[string, readonly string[]]>;

  return (
    <DataCard
      risk={risk}
      titleOverride={t.title}
      subtitle={t.subtitle(data.detectedCount, data.tested.length)}
      entropyLabel={i18n.entropyLabel}
      weightLabel={i18n.weight}
      riskBadgeLabel={riskBadgeLabel}
      emptySignalsLabel={i18n.signalsEmpty}
      averageMarkerLabel={i18n.averageMarker}
      delayMs={delayMs}
    >
      <div className="space-y-4">
        {groups.map(([group, fonts]) => {
          const found = fonts.filter((font) => detected.has(font)).length;
          return (
            <section key={group} aria-label={`${group} fonts`}>
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <span>{group}</span>
                <span className="font-mono tracking-normal text-slate-500">
                  {found}/{fonts.length}
                </span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {fonts.map((font) => {
                  const present = detected.has(font);
                  const rare = present && (FONT_PREVALENCE[font] ?? 0.1) < 0.1;
                  return (
                    <li
                      key={font}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border transition-all ${
                        present
                          ? rare
                            ? 'bg-rose-500/10 text-rose-200 border-rose-500/30 shadow-sm shadow-rose-900/30'
                            : 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30'
                          : 'bg-slate-900/40 text-slate-600 border-slate-800/80 line-through decoration-slate-700'
                      }`}
                      style={present ? { fontFamily: `'${font}', sans-serif` } : undefined}
                      title={present ? `${font} detected${rare ? ` (${t.rareBadge})` : ''}` : `${font} not detected`}
                    >
                      {present ? (
                        <span className={`h-1.5 w-1.5 rounded-full ${rare ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} aria-hidden="true" />
                      ) : null}
                      {font}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </DataCard>
  );
}

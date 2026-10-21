import Image from 'next/image';
import { Activity, Binary, Clock, Cpu, Eye, HardDrive, Languages, Layers, Lock, Monitor, Palette, ScanLine } from 'lucide-react';
import type { AudioData, CanvasData, EnvData, FontData, ModuleRisk, WebGLData } from '@/types/fingerprint';
import { FONT_PREVALENCE } from '@/lib/entropy/calculator';
import { formatNumber, truncateMiddle } from '@/lib/format';
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

function HashValue({ value }: { value: string }) {
  if (!value) {
    return <span className="text-slate-500">n/a</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <span title={value}>{truncateMiddle(value, 10, 6)}</span>
      <CopyButton value={value} label="Copy hash" />
    </span>
  );
}

interface CanvasCardProps {
  data: CanvasData;
  dataUrl: string;
  risk: ModuleRisk;
  delayMs?: number;
}

export function CanvasCard({ data, dataUrl, risk, delayMs }: CanvasCardProps) {
  return (
    <DataCard risk={risk} subtitle="2D raster · gradients · emoji · text shaping" delayMs={delayMs}>
      {data.supported && dataUrl ? (
        <div className="checkerboard relative mb-4 overflow-hidden rounded-xl ring-1 ring-slate-700/60">
          <Image
            src={dataUrl}
            alt="Canvas fingerprint render produced by your browser"
            width={data.width}
            height={data.height}
            unoptimized
            className="h-auto w-full"
          />
          <span className="absolute right-2 bottom-2 rounded-md bg-slate-950/80 px-2 py-0.5 font-mono text-[10px] text-fuchsia-300 ring-1 ring-fuchsia-500/30">
            {data.width}×{data.height} · PNG
          </span>
        </div>
      ) : (
        <div className="mb-4">
          <BlockedNotice message="Canvas readback returned no image data. Fingerprinting via canvas is blocked." />
        </div>
      )}
      <dl>
        <DataRow label="SHA-256" value={<HashValue value={data.hash} />} mono />
        <DataRow label="Data URL size" value={`${formatNumber(data.dataLength)} chars`} mono />
        <DataRow
          label="Stability"
          value={<StatusPill ok={!data.stable} okText="Randomized" badText="Deterministic" />}
        />
        <DataRow label="Even-odd winding" value={data.winding ? 'Supported' : 'Unsupported'} />
        <DataRow
          label="Raw preview"
          value={<span className="text-slate-400">{data.preview ? `${data.preview.slice(0, 42)}\u2026` : 'n/a'}</span>}
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
}

export function WebGLCard({ data, risk, delayMs }: WebGLCardProps) {
  return (
    <DataCard risk={risk} subtitle="WEBGL_debug_renderer_info · capability limits" delayMs={delayMs}>
      {data.supported ? (
        <>
          <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-400/80 uppercase">Unmasked renderer</p>
            <p className="mt-1 font-mono text-sm leading-snug break-words text-cyan-100">{data.unmaskedRenderer}</p>
            <p className="mt-2 text-xs text-slate-400">
              Vendor: <span className="text-slate-200">{data.unmaskedVendor}</span>
            </p>
          </div>
          <dl>
            <DataRow label="Context" value={data.contextVersion.toUpperCase()} mono />
            <DataRow label="Version" value={data.version} mono title={data.version} />
            <DataRow label="GLSL" value={data.shadingLanguageVersion} mono />
            <DataRow label="Extensions" value={formatNumber(data.extensionsCount)} mono highlight />
            <DataRow label="Max texture" value={`${formatNumber(data.maxTextureSize)} px`} mono />
            <DataRow
              label="Max viewport"
              value={data.maxViewportDims.length === 2 ? `${data.maxViewportDims[0]} × ${data.maxViewportDims[1]}` : 'n/a'}
              mono
            />
            <DataRow label="Renderbuffer" value={`${formatNumber(data.maxRenderbufferSize)} px`} mono />
            <DataRow label="Antialias" value={data.antialias ? 'Enabled' : 'Disabled'} />
            <DataRow label="Param hash" value={<HashValue value={data.parameterHash} />} mono />
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
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#waveform-fill)" />
      <path d={line} fill="none" stroke="#c4b5fd" strokeWidth="1.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface AudioCardProps {
  data: AudioData;
  risk: ModuleRisk;
  delayMs?: number;
}

export function AudioCard({ data, risk, delayMs }: AudioCardProps) {
  return (
    <DataCard risk={risk} subtitle="OfflineAudioContext · triangle osc → compressor" delayMs={delayMs}>
      {data.supported ? (
        <>
          <div className="mb-4 overflow-hidden rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 pt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-violet-300/80 uppercase">
              <span>Rendered buffer</span>
              <span className="font-mono tracking-normal normal-case text-violet-300/60">
                {data.frames} frames @ {formatNumber(data.sampleRate)} Hz
              </span>
            </div>
            <Waveform samples={data.samplePreview} />
          </div>
          <dl>
            <DataRow label="Sample sum" value={data.sampleSum.toFixed(10)} mono highlight />
            <DataRow label="Signature" value={<HashValue value={data.hash} />} mono />
            <DataRow label="Stability" value={<StatusPill ok={!data.stable} okText="Randomized" badText="Deterministic" />} />
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
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 transition-colors hover:border-blue-500/30">
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
        <Icon className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
        {label}
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
}

function formatOffset(minutes: number): string {
  const sign = minutes <= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const mins = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${mins}`;
}

export function EnvCard({ data, risk, delayMs, className }: EnvCardProps) {
  return (
    <DataCard risk={risk} subtitle="Screen · hardware · locale · navigator" delayMs={delayMs} className={className}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <EnvTile icon={Monitor} label="Screen" value={`${data.screenWidth} × ${data.screenHeight}`} />
        <EnvTile icon={Layers} label="Available" value={`${data.availWidth} × ${data.availHeight}`} />
        <EnvTile icon={Palette} label="Color depth" value={`${data.colorDepth}-bit`} />
        <EnvTile icon={ScanLine} label="Pixel ratio" value={`${data.pixelRatio}×`} />
        <EnvTile icon={Cpu} label="CPU threads" value={String(data.hardwareConcurrency || 'n/a')} />
        <EnvTile
          icon={HardDrive}
          label="Memory"
          value={data.deviceMemory === null ? 'Hidden' : `${data.deviceMemory} GB`}
          sub={data.deviceMemory === null ? 'API not exposed' : 'Bucketed value'}
        />
        <EnvTile icon={Clock} label="Timezone" value={data.timezone} sub={formatOffset(data.timezoneOffset)} />
        <EnvTile
          icon={Languages}
          label="Languages"
          value={data.languages.join(', ') || 'n/a'}
          sub={`${data.languages.length} declared`}
        />
        <EnvTile icon={Binary} label="Platform" value={data.platform} />
        <EnvTile icon={Activity} label="Touch points" value={String(data.maxTouchPoints)} />
        <EnvTile icon={Eye} label="Do Not Track" value={data.doNotTrack === '1' ? 'Enabled' : 'Off'} />
        <EnvTile icon={Lock} label="Cookies" value={data.cookieEnabled ? 'Enabled' : 'Disabled'} />
      </div>
      <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">User agent</span>
          <CopyButton value={data.userAgent} label="Copy user agent" />
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
}

export function FontsCard({ data, risk, delayMs }: FontsCardProps) {
  const detected = new Set(data.detected);
  const groups = Object.entries(FONT_GROUPS) as Array<[string, readonly string[]]>;

  return (
    <DataCard
      risk={risk}
      subtitle={`${data.detectedCount} of ${data.tested.length} probe fonts detected`}
      delayMs={delayMs}
    >
      <div className="space-y-4">
        {groups.map(([group, fonts]) => {
          const found = fonts.filter((font) => detected.has(font)).length;
          return (
            <section key={group} aria-label={`${group} fonts`}>
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                <span>{group}</span>
                <span className="font-mono tracking-normal text-slate-600">
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
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ring-1 ring-inset transition-colors ${
                        present
                          ? rare
                            ? 'bg-rose-500/10 text-rose-200 ring-rose-500/40'
                            : 'bg-lime-400/10 text-lime-100 ring-lime-400/30'
                          : 'bg-slate-900/60 text-slate-600 ring-slate-800 line-through decoration-slate-700'
                      }`}
                      style={present ? { fontFamily: `'${font}', sans-serif` } : undefined}
                      title={present ? `${font} detected${rare ? ' (rare)' : ''}` : `${font} not detected`}
                    >
                      {present ? (
                        <span className={`h-1.5 w-1.5 rounded-full ${rare ? 'bg-rose-400' : 'bg-lime-300'}`} aria-hidden="true" />
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

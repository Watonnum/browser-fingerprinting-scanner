import type { CSSProperties, ReactNode } from 'react';
import type { ModuleRisk } from '@/types/fingerprint';
import { formatBits } from '@/lib/format';
import { MODULE_META } from './moduleMeta';
import { RiskBadge } from './ui';

interface DataCardProps {
  risk: ModuleRisk;
  subtitle: string;
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

function SignalList({ risk, accent }: { risk: ModuleRisk; accent: string }) {
  if (risk.signals.length === 0) {
    return <p className="text-xs text-slate-500">No identifying signals were extracted from this probe.</p>;
  }
  const maxBits = Math.max(1, ...risk.signals.map((signal) => Math.max(signal.entropyBits, signal.referenceEntropyBits)));
  return (
    <ul className="space-y-2.5">
      {risk.signals.map((signal) => {
        const width = Math.max(2, (signal.entropyBits / maxBits) * 100);
        const reference = Math.min(100, (signal.referenceEntropyBits / maxBits) * 100);
        return (
          <li key={signal.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-slate-300" title={`${signal.name}: ${signal.value}`}>
                {signal.name}
              </span>
              <span className="shrink-0 font-mono text-slate-400 tabular-nums">
                {formatBits(signal.entropyBits)}
                <span className="text-slate-600"> bits</span>
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-800/80">
              <div
                className="animate-bar-grow absolute inset-y-0 left-0 origin-left rounded-full"
                style={{ width: `${width}%`, background: `linear-gradient(90deg, ${accent}66, ${accent})` }}
              />
              <div
                className="absolute inset-y-0 w-px bg-slate-300/70"
                style={{ left: `${reference}%` }}
                title={`Population average: ${formatBits(signal.referenceEntropyBits)} bits`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DataCard({ risk, subtitle, children, className = '', delayMs = 0 }: DataCardProps) {
  const meta = MODULE_META[risk.module];
  const Icon = meta.icon;
  const accentStyle = { '--accent': meta.accent, animationDelay: `${delayMs}ms` } as CSSProperties;

  return (
    <article
      id={`card-${risk.module}`}
      className={`glass-card glass-card-interactive animate-fade-up flex flex-col overflow-hidden rounded-2xl ${className}`}
      style={accentStyle}
    >
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }}
        aria-hidden="true"
      />
      <header className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
            style={{ background: `${meta.accent}14`, color: meta.accent, boxShadow: `0 0 24px -10px ${meta.accent}` }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-50">{meta.title}</h3>
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <RiskBadge level={risk.riskLevel} />
      </header>

      <div className="flex items-end justify-between gap-3 px-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Entropy</p>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">
            {formatBits(risk.entropyBits)}
            <span className="ml-1 text-sm font-medium text-slate-500">bits</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Weight</p>
          <p className="text-sm font-medium" style={{ color: meta.accent }}>
            {risk.weightClass}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4">{children}</div>

      <footer className="mt-5 border-t border-slate-800/70 bg-slate-950/40 p-5">
        <p className="mb-3 text-xs leading-relaxed text-slate-400">{risk.detail}</p>
        <SignalList risk={risk} accent={meta.accent} />
      </footer>
    </article>
  );
}

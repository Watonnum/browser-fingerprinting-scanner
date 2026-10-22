'use client';

import { Check, Copy } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { RiskLevel } from '@/types/fingerprint';

interface Tone {
  text: string;
  strong: string;
  soft: string;
  border: string;
  dot: string;
  hex: string;
  hero: string;
}

export const TONE: Record<RiskLevel, Tone> = {
  'High Risk': {
    text: 'text-rose-300',
    strong: 'text-rose-400',
    soft: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    hex: '#fb7185',
    hero: 'border-rose-500/25 from-rose-950/45',
  },
  Standard: {
    text: 'text-amber-300',
    strong: 'text-amber-400',
    soft: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    hex: '#fbbf24',
    hero: 'border-amber-500/25 from-amber-950/35',
  },
  Safe: {
    text: 'text-emerald-300',
    strong: 'text-emerald-400',
    soft: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    hex: '#34d399',
    hero: 'border-emerald-500/25 from-emerald-950/35',
  },
};

interface CopyButtonProps {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
}

export function CopyButton({ value, label, copiedLabel, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-700/70 bg-slate-800/60 p-1.5 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none ${className}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

export function BitsBadge({ bits, risk }: { bits: number; risk: RiskLevel }) {
  const tone = TONE[risk];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${tone.soft} ${tone.border} ${tone.text}`}
    >
      {bits.toFixed(2)} bits
    </span>
  );
}

export function RiskPill({ risk, label }: { risk: RiskLevel; label: string }) {
  const tone = TONE[risk];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tone.soft} ${tone.border} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const tone = TONE[risk];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone.soft} ${tone.border} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {risk}
    </span>
  );
}

export function StatusPill({
  status,
  label,
}: {
  status: 'pass' | 'warn' | 'fail' | 'info';
  label: string;
}) {
  const styles = {
    pass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    fail: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  }[status];

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {label}
    </span>
  );
}

export function DataRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-800/60 py-2 text-xs last:border-b-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`min-w-0 truncate text-right text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

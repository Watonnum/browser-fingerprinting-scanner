'use client';

import { Check, Copy, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { RiskLevel } from '@/types/fingerprint';
import type { IconComponent } from './moduleMeta';

const RISK_STYLES: Record<RiskLevel, { className: string; icon: IconComponent }> = {
  'High Risk': {
    className: 'bg-rose-500/10 text-rose-300 ring-rose-500/30 border-rose-500/20 shadow-[0_0_16px_-4px_rgba(244,63,94,0.35)]',
    icon: ShieldAlert,
  },
  Standard: {
    className: 'bg-amber-500/10 text-amber-300 ring-amber-500/30 border-amber-500/20 shadow-[0_0_16px_-4px_rgba(245,158,11,0.3)]',
    icon: Shield,
  },
  Safe: {
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30 border-emerald-500/20 shadow-[0_0_16px_-4px_rgba(16,185,129,0.3)]',
    icon: ShieldCheck,
  },
};

export const RISK_TEXT_COLOR: Record<RiskLevel, string> = {
  'High Risk': 'text-rose-400',
  Standard: 'text-amber-400',
  Safe: 'text-emerald-400',
};

export const RISK_HEX: Record<RiskLevel, string> = {
  'High Risk': '#fb7185',
  Standard: '#fbbf24',
  Safe: '#34d399',
};

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  size?: 'sm' | 'md';
}

export function RiskBadge({ level, label, size = 'sm' }: RiskBadgeProps) {
  const { className, icon: Icon } = RISK_STYLES[level];
  const sizing = size === 'md' ? 'gap-2 px-3 py-1.5 text-xs font-bold' : 'gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold';
  const displayLabel = label || level;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full tracking-wider border ring-1 ring-inset ${sizing} ${className}`}
    >
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = 'Copy', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      className={`inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none active:scale-95 ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  );
}

interface DataRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  highlight?: boolean;
  title?: string;
}

export function DataRow({ label, value, mono = false, highlight = false, title }: DataRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-xs font-medium tracking-wide text-slate-400">{label}</dt>
      <dd
        title={title}
        className={`min-w-0 text-right text-sm break-words ${mono ? 'font-mono text-[13px]' : ''} ${
          highlight ? 'font-semibold text-cyan-200' : 'text-slate-200'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

interface StatusPillProps {
  ok: boolean;
  okText: string;
  badText: string;
}

export function StatusPill({ ok, okText, badText }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        ok
          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} aria-hidden="true" />
      {ok ? okText : badText}
    </span>
  );
}

import { useId, type CSSProperties } from 'react';
import type { RiskLevel } from '@/types/fingerprint';

const GRADIENTS: Record<RiskLevel, [string, string]> = {
  'High Risk': ['#fb7185', '#f97316'],
  Standard: ['#f59e0b', '#fde047'],
  Safe: ['#10b981', '#22d3ee'],
};

interface UniquenessGaugeProps {
  value: number;
  level: RiskLevel;
  size?: number;
  subLabel?: string;
}

export function UniquenessGauge({ value, level, size = 184, subLabel = 'Unique' }: UniquenessGaugeProps) {
  const gradientId = useId();
  const glowId = useId();
  const radius = 62;
  const stroke = 11;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = arcLength * (1 - clamped / 100);
  const [from, to] = GRADIENTS[level];
  const ticks = Array.from({ length: 28 }, (_, index) => index);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" className="h-full w-full rotate-[135deg]" role="img" aria-label={`Uniqueness ${clamped}%`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {ticks.map((tick) => {
          const angle = (tick / (ticks.length - 1)) * 270 * (Math.PI / 180);
          const inner = radius - 16;
          const outer = radius - 12;
          return (
            <line
              key={tick}
              x1={80 + inner * Math.cos(angle)}
              y1={80 + inner * Math.sin(angle)}
              x2={80 + outer * Math.cos(angle)}
              y2={80 + outer * Math.sin(angle)}
              stroke={tick / (ticks.length - 1) <= clamped / 100 ? from : '#1e293b'}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          filter={`url(#${glowId})`}
          className="animate-gauge-fill"
          style={{ '--gauge-empty': `${arcLength}` } as CSSProperties}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
          {clamped.toFixed(clamped >= 99.95 ? 2 : 1)}
          <span className="text-lg text-slate-400">%</span>
        </span>
        <span className="mt-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{subLabel}</span>
      </div>
    </div>
  );
}

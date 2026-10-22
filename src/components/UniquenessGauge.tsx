import { useId, type CSSProperties, type ReactNode } from 'react';
import type { RiskLevel } from '@/types/fingerprint';
import { TONE } from './ui';

const GRADIENTS: Record<RiskLevel, [string, string]> = {
  'High Risk': ['#fb7185', '#f43f5e'],
  Standard: ['#fde047', '#f59e0b'],
  Safe: ['#22d3ee', '#10b981'],
};

interface UniquenessGaugeProps {
  value: number;
  level: RiskLevel;
  size?: number;
  children?: ReactNode;
}

export function UniquenessGauge({ value, level, size = 188, children }: UniquenessGaugeProps) {
  const gradientId = useId();
  const radius = 70;
  const stroke = 9;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference * (1 - clamped / 100);
  const [from, to] = GRADIENTS[level];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-4 rounded-full"
        style={{ boxShadow: `0 0 60px -12px ${TONE[level].hex}` }}
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 160 160"
        className="relative h-full w-full -rotate-90"
        role="img"
        aria-label={`${clamped.toFixed(2)}%`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-gauge-fill"
          style={{ '--gauge-empty': `${circumference}` } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

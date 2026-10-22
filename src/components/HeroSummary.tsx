import { ShieldCheck, TriangleAlert } from 'lucide-react';
import type { RiskAssessmentResult } from '@/types/fingerprint';
import { formatBits, formatMs, formatNumber, formatOneIn, formatRelative, truncateMiddle } from '@/lib/format';
import type { Dict, Locale } from '@/lib/i18n';
import { UniquenessGauge } from './UniquenessGauge';
import { CopyButton, RiskPill, TONE } from './ui';

interface HeroSummaryProps {
  result: RiskAssessmentResult;
  t: Dict;
  locale: Locale;
}

function StatTile({ label, value, unit, sub, accent }: { label: string; value: string; unit?: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-white tabular-nums">
        {value}
        {unit ? <span className={`ml-1.5 text-sm font-medium ${accent}`}>{unit}</span> : null}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

export function HeroSummary({ result, t, locale }: HeroSummaryProps) {
  const { tracking, riskLevel } = result;
  const tone = TONE[riskLevel];
  const headline = t.hero.headline[riskLevel];
  const body = tracking.recognized ? t.hero.bodyRecognized : riskLevel === 'Safe' ? t.hero.bodySafe : t.hero.bodyFirst;
  const population = formatNumber(result.referencePopulation);
  const cohortLine =
    result.anonymitySetSize <= 1 ? t.hero.uniqueAmong(population) : t.hero.sharedWith(formatOneIn(result.anonymitySetSize));

  return (
    <section
      aria-labelledby="hero-title"
      className={`relative overflow-hidden rounded-3xl border bg-linear-to-br via-slate-900/70 to-slate-950 p-5 sm:p-8 ${tone.hero}`}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:items-center">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-7">
          <UniquenessGauge value={result.uniquenessScore} level={riskLevel}>
            <span className="font-mono text-4xl font-bold text-white tabular-nums">
              {result.uniquenessScore.toFixed(2)}
              <span className="text-lg text-slate-400">%</span>
            </span>
            <span className={`mt-1 text-xs font-semibold ${tone.strong}`}>{t.hero.gaugeCaption[riskLevel]}</span>
            <span className="mt-0.5 text-[11px] text-slate-500">{cohortLine}</span>
          </UniquenessGauge>
          <RiskPill risk={riskLevel} label={t.riskLong[riskLevel]} />
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {tracking.recognized ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300">
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                {t.hero.tracked}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {t.hero.firstVisit}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {tracking.recognized
                ? t.hero.lastSeen(formatRelative(tracking.lastSeen, locale), tracking.visitCount)
                : t.hero.firstVisitMeta}
            </span>
          </div>

          <h1 id="hero-title" className="text-2xl leading-snug font-bold text-white sm:text-3xl">
            {headline.before}
            <span className={tone.strong}>{headline.highlight}</span>
            {headline.after}
          </h1>

          <p className="max-w-3xl text-sm leading-relaxed text-slate-300">{body}</p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr]">
            <StatTile
              label={t.hero.entropy}
              value={formatBits(result.totalEntropyBits)}
              unit="bits"
              sub={t.hero.entropySub}
              accent="text-cyan-400"
            />
            <StatTile
              label={t.hero.speed}
              value={formatMs(result.collectionTimeMs).replace(/ (ms|s)$/, '')}
              unit={result.collectionTimeMs >= 1000 ? 's' : 'ms'}
              sub={t.hero.speedSub}
              accent="text-emerald-400"
            />
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 sm:col-span-2 xl:col-span-1">
              <p className="text-xs text-slate-400">{t.hero.hash}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="truncate font-mono text-sm text-cyan-300" title={result.compositeHash}>
                  {truncateMiddle(result.compositeHash, 10, 8)}
                </p>
                <CopyButton value={result.compositeHash} label={t.copy} copiedLabel={t.copied} />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{t.hero.hashSub}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

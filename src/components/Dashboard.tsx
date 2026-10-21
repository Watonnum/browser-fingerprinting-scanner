'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Fingerprint,
  HardDrive,
  Layers,
  Lock,
  Radar,
  RefreshCw,
  ScanLine,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  formatBits,
  formatDateTime,
  formatMs,
  formatNumber,
  formatOneIn,
  formatRelative,
  truncateMiddle,
} from '@/lib/format';
import { translations, type Locale } from '@/lib/i18n';
import { collectFingerprint } from '@/lib/probes';
import type {
  FingerprintPayload,
  ModuleKey,
  ModuleRisk,
  RiskAssessmentResult,
  RiskLevel,
} from '@/types/fingerprint';
import { LanguageSwitch } from './LanguageSwitch';
import { LazySection } from './LazySection';
import { AudioCard, CanvasCard, EnvCard, FontsCard, WebGLCard } from './ProbeCards';
import { UniquenessGauge } from './UniquenessGauge';
import { MODULE_META } from './moduleMeta';
import { CopyButton, RiskBadge } from './ui';

type ScanStage = 'idle' | 'probing' | 'analyzing' | 'complete' | 'error';

const PROBE_LIST: ModuleKey[] = ['canvas', 'webgl', 'audio', 'env', 'fonts'];

export default function Dashboard() {
  const [locale, setLocale] = useState<Locale>('th');
  const [stage, setStage] = useState<ScanStage>('idle');
  const [completedProbes, setCompletedProbes] = useState<Record<ModuleKey, number>>({} as Record<ModuleKey, number>);
  const [payload, setPayload] = useState<FingerprintPayload | null>(null);
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | RiskLevel>('All');

  useEffect(() => {
    const saved = localStorage.getItem('cyberscan_locale') as Locale | null;
    if (saved === 'en' || saved === 'th') {
      setLocale(saved);
    }
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('cyberscan_locale', newLocale);
  };

  const t = translations[locale];

  const executeScan = useCallback(async () => {
    try {
      setStage('probing');
      setErrorMsg(null);
      setCompletedProbes({} as Record<ModuleKey, number>);

      const collected = await collectFingerprint({
        onProbeComplete: (mod, elapsed) => {
          setCompletedProbes((prev) => ({ ...prev, [mod]: elapsed }));
        },
      });

      setPayload(collected);
      setStage('analyzing');

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collected),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const assessment: RiskAssessmentResult = await response.json();
      setResult(assessment);
      setStage('complete');
    } catch (err) {
      setStage('error');
      setErrorMsg(err instanceof Error ? err.message : 'Fingerprint scanning encounter an unexpected error');
    }
  }, []);

  useEffect(() => {
    executeScan();
  }, [executeScan]);

  const moduleRiskMap = (result?.modules || []).reduce<Record<ModuleKey, ModuleRisk>>(
    (acc, mod) => {
      acc[mod.module] = mod;
      return acc;
    },
    {} as Record<ModuleKey, ModuleRisk>,
  );

  const filteredRecommendations = (result?.recommendations || []).filter((rec) => {
    if (activeFilter === 'All') return true;
    return rec.priority === activeFilter;
  });

  const getRiskLabel = (level: RiskLevel): string => {
    if (locale === 'th') {
      if (level === 'High Risk') return 'เสี่ยงสูง';
      if (level === 'Standard') return 'ปกติ';
      return 'ปลอดภัย';
    }
    return level;
  };

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 cyber-glow antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="cyber-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-[0_0_20px_-3px_rgba(6,182,212,0.3)]">
              <Fingerprint className="h-5 w-5" />
              {stage === 'probing' && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider text-slate-100 uppercase sm:text-base">
                  CyberScan <span className="text-cyan-400">Fingerprint</span>
                </span>
                <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 sm:inline-block">
                  {t.brand.versionBadge}
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">
                {t.brand.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {stage === 'complete' && result && (
              <div className="hidden items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">
                  {locale === 'th' ? 'ฐานข้อมูลสะสม:' : 'Registry:'}
                </span>
                <span className="font-mono text-xs font-semibold text-cyan-300">
                  {formatNumber(result.tracking.knownProfiles)} {locale === 'th' ? 'โปรไฟล์' : 'Profiles'}
                </span>
              </div>
            )}

            <LanguageSwitch currentLocale={locale} onLocaleChange={handleLocaleChange} />

            <button
              type="button"
              id="rescan-button"
              disabled={stage === 'probing' || stage === 'analyzing'}
              onClick={executeScan}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_-4px_rgba(6,182,212,0.6)] transition-all hover:bg-cyan-400 hover:shadow-[0_0_25px_-2px_rgba(6,182,212,0.8)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${stage === 'probing' || stage === 'analyzing' ? 'animate-spin' : ''}`}
              />
              <span className="hidden xs:inline">
                {stage === 'probing' || stage === 'analyzing' ? t.actions.scanning : t.actions.rescan}
              </span>
              <span className="xs:hidden">
                {stage === 'probing' || stage === 'analyzing' ? '...' : t.actions.rescan.slice(0, 5)}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {(stage === 'probing' || stage === 'analyzing') && (
          <section className="glass-card overflow-hidden rounded-2xl border-cyan-500/30 p-6 shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/40 bg-cyan-950/60">
                  <Radar className="h-7 w-7 animate-spin text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {stage === 'probing' ? t.actions.scanning : t.actions.analyzing}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {locale === 'th'
                      ? 'ระบบกำลังดึงข้อมูล Canvas, WebGL, AudioContext, ระบบปฏิบัติการ และชุดฟอนต์แบบขนาน'
                      : 'Executing parallel client-side probes across Canvas, WebGL, AudioContext, System & Fonts.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:w-auto">
                {PROBE_LIST.map((key) => {
                  const meta = MODULE_META[key];
                  const Icon = meta.icon;
                  const isDone = key in completedProbes;
                  const probeName = t.probesSection.modules[key].short;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isDone ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-medium">{probeName}</span>
                      {isDone ? (
                        <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />
                      ) : (
                        <span className="ml-auto h-1.5 w-1.5 animate-ping rounded-full bg-cyan-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {stage === 'error' && (
          <section className="glass-card rounded-2xl border-rose-500/40 bg-rose-950/20 p-6 shadow-[0_0_30px_-10px_rgba(244,63,94,0.3)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/30">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-rose-200">
                  {locale === 'th' ? 'การสแกนเกิดข้อผิดพลาด' : 'Probe Execution Failed'}
                </h2>
                <p className="text-xs text-rose-300/80">{errorMsg}</p>
                <button
                  type="button"
                  onClick={executeScan}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t.actions.tryAgain}
                </button>
              </div>
            </div>
          </section>
        )}

        {result && payload && (
          <>
            <section
              id="stateless-tracking-banner"
              className={`glass-card overflow-hidden rounded-2xl border p-6 transition-all ${
                result.tracking.recognized
                  ? 'border-rose-500/40 bg-rose-950/15 shadow-[0_0_40px_-10px_rgba(244,63,94,0.35)]'
                  : 'border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)]'
              }`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ring-1 ${
                      result.tracking.recognized
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 ring-rose-500/30'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                    }`}
                  >
                    {result.tracking.recognized ? (
                      <UserCheck className="h-6 w-6" />
                    ) : (
                      <ShieldCheck className="h-6 w-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ring-1 ${
                          result.tracking.recognized
                            ? 'border-rose-500/40 bg-rose-500/20 text-rose-300 ring-rose-500/40'
                            : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                        }`}
                      >
                        {result.tracking.recognized
                          ? t.statelessBanner.activeBadge
                          : t.statelessBanner.firstVisitBadge}
                      </span>
                      <span className="text-xs text-slate-400">
                        {result.tracking.recognized
                          ? t.statelessBanner.hardwareMatched
                          : t.statelessBanner.baselineCaptured}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {result.tracking.recognized
                        ? t.statelessBanner.recognizedTitle(result.tracking.visitCount)
                        : t.statelessBanner.firstVisitTitle}
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {result.tracking.recognized
                        ? t.statelessBanner.recognizedDesc(
                            formatRelative(result.tracking.firstSeen),
                            formatDateTime(result.tracking.firstSeen),
                          )
                        : t.statelessBanner.firstVisitDesc}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 lg:flex-col lg:items-end lg:gap-2">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      {t.statelessBanner.hardwareHashLabel}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-xs text-cyan-300">
                        {truncateMiddle(result.tracking.hardwareHash, 8, 8)}
                      </span>
                      <CopyButton value={result.tracking.hardwareHash} label={t.actions.copy} />
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      {t.statelessBanner.observationLabel}
                    </p>
                    <p className="text-xs font-semibold text-slate-200">
                      {result.tracking.recognized
                        ? t.statelessBanner.visitObservations(result.tracking.visitCount)
                        : t.statelessBanner.firstObservation}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section aria-label="Summary Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card flex flex-col justify-between rounded-2xl border border-slate-800/80 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    {t.metrics.uniqueness}
                  </span>
                  <RiskBadge level={result.riskLevel} label={getRiskLabel(result.riskLevel)} />
                </div>
                <div className="my-2 flex justify-center py-2">
                  <UniquenessGauge
                    value={result.uniquenessScore}
                    level={result.riskLevel}
                    size={150}
                    subLabel={locale === 'th' ? 'ไม่ซ้ำใคร' : 'Unique'}
                  />
                </div>
                <div className="border-t border-slate-800/60 pt-3 text-center">
                  <p className="text-xs text-slate-400">
                    {t.metrics.cohortEstimate(formatOneIn(result.anonymitySetSize))}
                  </p>
                </div>
              </div>

              <div className="glass-card flex flex-col justify-between rounded-2xl border border-slate-800/80 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    {t.metrics.totalEntropy}
                  </span>
                  <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    Shannon
                  </span>
                </div>
                <div className="my-auto py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold tracking-tight text-white tabular-nums">
                      {formatBits(result.totalEntropyBits)}
                    </span>
                    <span className="text-sm font-medium text-slate-400">{t.metrics.bits}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {t.metrics.entropyDesc(
                      formatNumber(Math.min(5000000, Math.pow(2, Math.round(result.totalEntropyBits)))),
                    )}
                  </p>
                </div>
                <div className="space-y-1.5 border-t border-slate-800/60 pt-3">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{t.metrics.identifyingStrength}</span>
                    <span className="font-medium text-slate-200">
                      {result.totalEntropyBits >= 33
                        ? t.metrics.strengthLevels.extreme
                        : result.totalEntropyBits >= 20
                        ? t.metrics.strengthLevels.high
                        : t.metrics.strengthLevels.moderate}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400"
                      style={{ width: `${Math.min(100, (result.totalEntropyBits / 40) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card flex flex-col justify-between rounded-2xl border border-slate-800/80 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    {t.metrics.masterHash}
                  </span>
                  <Fingerprint className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="my-auto py-3 space-y-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <p className="font-mono text-[11px] leading-relaxed break-all text-cyan-300">
                      {result.compositeHash}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{t.metrics.sha256Digest}</span>
                    <CopyButton value={result.compositeHash} label={t.actions.copy} />
                  </div>
                </div>
                <div className="border-t border-slate-800/60 pt-3">
                  <p className="text-[11px] text-slate-400">
                    {t.metrics.masterHashDesc}
                  </p>
                </div>
              </div>

              <div className="glass-card flex flex-col justify-between rounded-2xl border border-slate-800/80 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    {t.metrics.scanLatency}
                  </span>
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div className="my-auto py-4 space-y-3">
                  <div>
                    <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
                      {formatMs(result.collectionTimeMs)}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{t.metrics.scanLatency}</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>{t.metrics.probesEvaluated}</span>
                      <span className="font-medium text-slate-200">{result.modules.length} / 5</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{t.metrics.serverAuditTime}</span>
                      <span className="font-medium text-slate-200">{formatDateTime(result.analyzedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-800/60 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t.metrics.verifiedStateless}</span>
                  </div>
                </div>
              </div>
            </section>

            <LazySection id="extracted-signatures" delayMs={50}>
              <div className="space-y-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">{t.probesSection.title}</h2>
                    <p className="text-xs text-slate-400">{t.probesSection.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{t.probesSection.legend.label}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t.probesSection.legend.safe}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-400" /> {t.probesSection.legend.standard}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                      <span className="h-2 w-2 rounded-full bg-rose-400" /> {t.probesSection.legend.highRisk}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {moduleRiskMap.canvas && (
                    <LazySection delayMs={60}>
                      <CanvasCard
                        data={payload.canvas}
                        dataUrl={payload.canvas.dataUrl}
                        risk={moduleRiskMap.canvas}
                        i18n={t.probesSection}
                        riskBadgeLabel={getRiskLabel(moduleRiskMap.canvas.riskLevel)}
                        copyLabel={t.actions.copy}
                        delayMs={40}
                      />
                    </LazySection>
                  )}
                  {moduleRiskMap.webgl && (
                    <LazySection delayMs={90}>
                      <WebGLCard
                        data={payload.webgl}
                        risk={moduleRiskMap.webgl}
                        i18n={t.probesSection}
                        riskBadgeLabel={getRiskLabel(moduleRiskMap.webgl.riskLevel)}
                        copyLabel={t.actions.copy}
                        delayMs={60}
                      />
                    </LazySection>
                  )}
                  {moduleRiskMap.audio && (
                    <LazySection delayMs={120}>
                      <AudioCard
                        data={payload.audio}
                        risk={moduleRiskMap.audio}
                        i18n={t.probesSection}
                        riskBadgeLabel={getRiskLabel(moduleRiskMap.audio.riskLevel)}
                        copyLabel={t.actions.copy}
                        delayMs={80}
                      />
                    </LazySection>
                  )}
                  {moduleRiskMap.fonts && (
                    <LazySection delayMs={150}>
                      <FontsCard
                        data={payload.fonts}
                        risk={moduleRiskMap.fonts}
                        i18n={t.probesSection}
                        riskBadgeLabel={getRiskLabel(moduleRiskMap.fonts.riskLevel)}
                        delayMs={100}
                      />
                    </LazySection>
                  )}
                  {moduleRiskMap.env && (
                    <LazySection delayMs={180} className="lg:col-span-2">
                      <EnvCard
                        data={payload.env}
                        risk={moduleRiskMap.env}
                        i18n={t.probesSection}
                        riskBadgeLabel={getRiskLabel(moduleRiskMap.env.riskLevel)}
                        copyLabel={t.actions.copy}
                        delayMs={120}
                        className="w-full"
                      />
                    </LazySection>
                  )}
                </div>
              </div>
            </LazySection>

            <LazySection id="privacy-advisor" delayMs={100}>
              <section
                aria-label="Privacy Advisor"
                className="glass-card rounded-2xl border border-cyan-500/20 p-6 shadow-[0_0_40px_-15px_rgba(6,182,212,0.2)] space-y-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <h2 className="text-xl font-bold tracking-tight text-white">{t.advisor.title}</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{t.advisor.subtitle}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'All', label: t.advisor.filterAll },
                      { key: 'High Risk', label: t.advisor.filterHigh },
                      { key: 'Standard', label: t.advisor.filterStandard },
                      { key: 'Safe', label: t.advisor.filterSafe },
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setActiveFilter(filter.key as 'All' | RiskLevel)}
                        className={`cursor-pointer rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                          activeFilter === filter.key
                            ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-900/40'
                            : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredRecommendations.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                      {t.advisor.emptyFiltered}
                    </div>
                  ) : (
                    filteredRecommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 transition-colors hover:border-slate-700"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                              <RiskBadge level={rec.priority} label={getRiskLabel(rec.priority)} />
                            </div>
                            <p className="text-xs text-slate-400">{rec.rationale}</p>
                          </div>
                        </div>

                        {rec.actions && rec.actions.length > 0 && (
                          <div className="mt-4 space-y-2 border-t border-slate-800/60 pt-4">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                              {t.advisor.actionsHeading}
                            </p>
                            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {rec.actions.map((act, index) => (
                                <li
                                  key={index}
                                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-slate-300 leading-snug">{act.label}</span>
                                    {act.browser && (
                                      <span className="shrink-0 rounded-md border border-slate-700/80 bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                        {act.browser}
                                      </span>
                                    )}
                                  </div>
                                  {act.value && (
                                    <div className="mt-2.5 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1 font-mono text-[11px] text-cyan-300">
                                      <span className="truncate">{act.value}</span>
                                      <CopyButton value={act.value} label={t.advisor.copyFlag} />
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-5 w-5 text-cyan-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{t.advisor.ctaHeadline}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.advisor.ctaSub}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={executeScan}
                    className="inline-flex cursor-pointer shrink-0 items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 active:scale-95"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t.actions.reScanNow}
                  </button>
                </div>
              </section>
            </LazySection>
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl space-y-2">
          <p>{t.footer.disclaimer}</p>
          <p className="text-[11px] text-slate-600 font-mono">
            Next.js App Router · Shannon Entropy Engine · SHA-256 WebCrypto
          </p>
        </div>
      </footer>
    </div>
  );
}

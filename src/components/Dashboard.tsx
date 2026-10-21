'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
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
import { collectFingerprint } from '@/lib/probes';
import type {
  FingerprintPayload,
  ModuleKey,
  ModuleRisk,
  RiskAssessmentResult,
  RiskLevel,
} from '@/types/fingerprint';
import { AudioCard, CanvasCard, EnvCard, FontsCard, WebGLCard } from './ProbeCards';
import { UniquenessGauge } from './UniquenessGauge';
import { MODULE_META } from './moduleMeta';
import { CopyButton, RiskBadge } from './ui';

type ScanStage = 'idle' | 'probing' | 'analyzing' | 'complete' | 'error';

const PROBE_LIST: ModuleKey[] = ['canvas', 'webgl', 'audio', 'env', 'fonts'];

export default function Dashboard() {
  const [stage, setStage] = useState<ScanStage>('idle');
  const [completedProbes, setCompletedProbes] = useState<Record<ModuleKey, number>>({} as Record<ModuleKey, number>);
  const [payload, setPayload] = useState<FingerprintPayload | null>(null);
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | RiskLevel>('All');

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

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 cyber-glow">
      <div className="cyber-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-cyan-500/40 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]">
              <Fingerprint className="h-5 w-5 text-cyan-400" />
              {stage === 'probing' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase sm:text-base">
                  CyberScan <span className="text-cyan-400">Fingerprint</span>
                </h1>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
                  MVP v1.0
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">
                Stateless Hardware Identification & Shannon Entropy Profiling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stage === 'complete' && result && (
              <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 md:flex">
                <span className="text-xs text-slate-400">Total Scanned:</span>
                <span className="font-mono text-xs font-semibold text-cyan-300">
                  {formatNumber(result.tracking.knownProfiles)} Profiles
                </span>
              </div>
            )}
            <button
              type="button"
              id="rescan-button"
              disabled={stage === 'probing' || stage === 'analyzing'}
              onClick={executeScan}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_20px_-5px_rgba(6,182,212,0.6)] transition-all hover:bg-cyan-400 hover:shadow-[0_0_25px_-3px_rgba(6,182,212,0.8)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${stage === 'probing' || stage === 'analyzing' ? 'animate-spin' : ''}`}
              />
              <span>{stage === 'probing' || stage === 'analyzing' ? 'Scanning...' : 'Re-Scan Browser'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {(stage === 'probing' || stage === 'analyzing') && (
          <section className="glass-card overflow-hidden rounded-2xl border-cyan-500/30 p-6 shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-950/60 ring-1 ring-cyan-500/50">
                  <Radar className="h-7 w-7 animate-spin text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {stage === 'probing' ? 'Extracting Hardware & API Signals...' : 'Calculating Shannon Entropy...'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Executing parallel client-side probes across Canvas, WebGL, AudioContext, System & Fonts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:w-auto">
                {PROBE_LIST.map((key) => {
                  const meta = MODULE_META[key];
                  const Icon = meta.icon;
                  const isDone = key in completedProbes;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isDone ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-medium">{meta.short}</span>
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
                <h2 className="text-base font-bold text-rose-200">Probe Execution Failed</h2>
                <p className="text-xs text-rose-300/80">{errorMsg}</p>
                <button
                  type="button"
                  onClick={executeScan}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
                >
                  <RefreshCw className="h-3 w-3" />
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {result && payload && (
          <>
            <section
              id="stateless-tracking-banner"
              className={`glass-card overflow-hidden rounded-2xl p-6 transition-all ${
                result.tracking.recognized
                  ? 'border-rose-500/40 bg-rose-950/15 shadow-[0_0_40px_-10px_rgba(244,63,94,0.35)]'
                  : 'border-emerald-500/40 bg-emerald-950/15 shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)]'
              }`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      result.tracking.recognized
                        ? 'bg-rose-500/10 text-rose-400 ring-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
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
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ring-1 ${
                          result.tracking.recognized
                            ? 'bg-rose-500/20 text-rose-300 ring-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                        }`}
                      >
                        {result.tracking.recognized ? 'Stateless Re-Identification Active' : 'First Visit Recorded'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {result.tracking.recognized
                          ? `Matched via ${result.tracking.matchType} hardware signature`
                          : 'Hardware baseline captured in stateless engine'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {result.tracking.recognized
                        ? `You Were Recognized Without Cookies (Visit #${result.tracking.visitCount})`
                        : 'No Previous Hardware Fingerprint Match Found'}
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {result.tracking.recognized
                        ? `Even if you switch to Incognito/Private mode, clear all cookies, or use a proxy, your hardware configuration matches visit from ${formatRelative(
                            result.tracking.firstSeen,
                          )} (${formatDateTime(result.tracking.firstSeen)}).`
                        : 'Your unique mathematical fingerprint has now been recorded. If you reload or open this URL in Incognito mode, the scanner will re-identify you instantly without cookies.'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 lg:flex-col lg:items-end lg:gap-2">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Hardware Identity Hash
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-xs text-cyan-300">
                        {truncateMiddle(result.tracking.hardwareHash, 8, 8)}
                      </span>
                      <CopyButton value={result.tracking.hardwareHash} label="Copy hardware hash" />
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                      Stateless Recognition
                    </p>
                    <p className="text-xs font-semibold text-slate-200">
                      {result.tracking.recognized ? `${result.tracking.visitCount} Observations` : 'First Observation'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section aria-label="Summary Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card flex flex-col justify-between rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Uniqueness Score</span>
                  <RiskBadge level={result.riskLevel} />
                </div>
                <div className="my-2 flex justify-center py-2">
                  <UniquenessGauge value={result.uniquenessScore} level={result.riskLevel} size={150} />
                </div>
                <div className="border-t border-slate-800/60 pt-3 text-center">
                  <p className="text-xs text-slate-400">
                    Cohort: ~1 in{' '}
                    <span className="font-semibold text-cyan-300">{formatOneIn(result.anonymitySetSize)}</span>{' '}
                    browsers
                  </p>
                </div>
              </div>

              <div className="glass-card flex flex-col justify-between rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Total Entropy</span>
                  <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-300 ring-1 ring-purple-500/30">
                    Shannon
                  </span>
                </div>
                <div className="my-auto py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold tracking-tight text-white tabular-nums">
                      {formatBits(result.totalEntropyBits)}
                    </span>
                    <span className="text-sm font-medium text-slate-400">bits</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Equivalent to identifying 1 individual out of {formatNumber(Math.min(5000000, Math.pow(2, Math.round(result.totalEntropyBits))))} candidates in the reference dataset.
                  </p>
                </div>
                <div className="space-y-1.5 border-t border-slate-800/60 pt-3">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Identifying Strength</span>
                    <span className="font-medium text-slate-200">
                      {result.totalEntropyBits >= 33 ? 'Extreme' : result.totalEntropyBits >= 20 ? 'High' : 'Moderate'}
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

              <div className="glass-card flex flex-col justify-between rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Master Fingerprint Hash
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
                    <span>SHA-256 Digest</span>
                    <CopyButton value={result.compositeHash} label="Copy master hash" />
                  </div>
                </div>
                <div className="border-t border-slate-800/60 pt-3">
                  <p className="text-[11px] text-slate-400">
                    Composite derived from Canvas, WebGL, AudioContext, Font set, and Navigator data.
                  </p>
                </div>
              </div>

              <div className="glass-card flex flex-col justify-between rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Scan Execution</span>
                  <Zap className="h-4 w-4 text-amber-400" />
                </div>
                <div className="my-auto py-4 space-y-3">
                  <div>
                    <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
                      {formatMs(result.collectionTimeMs)}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Parallel Probe Latency</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Probes Evaluated:</span>
                      <span className="font-medium text-slate-200">{result.modules.length} / 5</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Server Audit Time:</span>
                      <span className="font-medium text-slate-200">{formatDateTime(result.analyzedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-800/60 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Stateless Non-Cookie Telemetry</span>
                  </div>
                </div>
              </div>
            </section>

            <section aria-label="Extracted Hardware Signatures" className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Extracted Hardware Signatures</h2>
                  <p className="text-xs text-slate-400">
                    Individual risk badges, extracted hardware attributes, and entropy breakdown per probe.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Legend:</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Safe
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> Standard
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                    <span className="h-2 w-2 rounded-full bg-rose-400" /> High Risk
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {moduleRiskMap.canvas && (
                  <CanvasCard
                    data={payload.canvas}
                    dataUrl={payload.canvas.dataUrl}
                    risk={moduleRiskMap.canvas}
                    delayMs={50}
                  />
                )}
                {moduleRiskMap.webgl && (
                  <WebGLCard data={payload.webgl} risk={moduleRiskMap.webgl} delayMs={100} />
                )}
                {moduleRiskMap.audio && (
                  <AudioCard data={payload.audio} risk={moduleRiskMap.audio} delayMs={150} />
                )}
                {moduleRiskMap.fonts && (
                  <FontsCard data={payload.fonts} risk={moduleRiskMap.fonts} delayMs={200} />
                )}
                {moduleRiskMap.env && (
                  <EnvCard
                    data={payload.env}
                    risk={moduleRiskMap.env}
                    delayMs={250}
                    className="lg:col-span-2"
                  />
                )}
              </div>
            </section>

            <section
              id="privacy-advisor"
              aria-label="Privacy Advisor"
              className="glass-card rounded-2xl border-cyan-500/20 p-6 shadow-[0_0_40px_-15px_rgba(6,182,212,0.2)] space-y-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-xl font-bold tracking-tight text-white">Privacy Hardening Advisor</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Actionable mitigations dynamically tailored to your detected entropy leaks.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(['All', 'High Risk', 'Standard', 'Safe'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                        activeFilter === filter
                          ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredRecommendations.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                    No recommendations matching current filter.
                  </div>
                ) : (
                  filteredRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 transition-colors hover:border-slate-700/80"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{rec.title}</h3>
                            <RiskBadge level={rec.priority} />
                          </div>
                          <p className="text-xs text-slate-400">{rec.rationale}</p>
                        </div>
                      </div>

                      {rec.actions && rec.actions.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-slate-800/60 pt-4">
                          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                            Recommended Actions
                          </p>
                          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {rec.actions.map((act, index) => (
                              <li
                                key={index}
                                className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-slate-300">{act.label}</span>
                                  {act.browser && (
                                    <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                                      {act.browser}
                                    </span>
                                  )}
                                </div>
                                {act.value && (
                                  <div className="mt-2 flex items-center justify-between rounded bg-slate-900 px-2 py-1 font-mono text-[11px] text-cyan-300">
                                    <span className="truncate">{act.value}</span>
                                    <CopyButton value={act.value} label="Copy flag" />
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
                  <p className="text-xs text-slate-300">
                    Test your hardened browser configuration by running a fresh scan now.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={executeScan}
                  className="inline-flex cursor-pointer shrink-0 items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-Scan Now
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-6 text-center text-xs text-slate-600">
        <p>
          Educational demonstration of client-side browser fingerprinting and stateless tracking mechanisms. No cookies are stored.
        </p>
      </footer>
    </div>
  );
}

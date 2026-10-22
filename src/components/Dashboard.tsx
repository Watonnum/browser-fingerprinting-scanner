'use client';

import {
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  RefreshCw,
  ScanLine,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatNumber } from '@/lib/format';
import { translations } from '@/lib/i18n';
import { indexModules } from '@/lib/insights';
import { useLocale } from '@/lib/locale';
import { collectFingerprint } from '@/lib/probes';
import type {
  FingerprintPayload,
  ModuleKey,
  RiskAssessmentResult,
} from '@/types/fingerprint';
import { AdvisorSection } from './AdvisorSection';
import { AudioFontsCard, EnvCard, GpuCard } from './HardwareCards';
import { HeroSummary } from './HeroSummary';
import { LanguageSwitch } from './LanguageSwitch';
import { LazySection } from './LazySection';

type ScanStage = 'idle' | 'probing' | 'analyzing' | 'complete' | 'error';

const PROBE_LIST: ModuleKey[] = ['canvas', 'webgl', 'audio', 'env', 'fonts'];

export default function Dashboard() {
  const [locale, setLocale] = useLocale();
  const [stage, setStage] = useState<ScanStage>('idle');
  const [completedProbes, setCompletedProbes] = useState<Partial<Record<ModuleKey, number>>>({});
  const [payload, setPayload] = useState<FingerprintPayload | null>(null);
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = translations[locale];

  const executeScan = useCallback(async () => {
    try {
      setStage('probing');
      setErrorMsg(null);
      setCompletedProbes({});

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
      setErrorMsg(err instanceof Error ? err.message : 'Fingerprint scanning encountered an error');
    }
  }, []);

  useEffect(() => {
    executeScan();
  }, [executeScan]);

  const isScanning = stage === 'probing' || stage === 'analyzing';
  const moduleMap = result ? indexModules(result.modules) : {};

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/40 bg-linear-to-br from-cyan-500/20 to-blue-600/10 shadow-lg shadow-cyan-500/10">
              <Fingerprint className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              {isScanning ? (
                <span className="absolute -inset-1 animate-pulse rounded-2xl border border-cyan-400/40" />
              ) : null}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
                  CyberScan
                </span>
                <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  {t.header.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400">{t.header.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {result ? (
              <span className="hidden font-mono text-xs text-slate-500 sm:inline-block">
                {t.header.registry(formatNumber(result.referencePopulation))}
              </span>
            ) : null}

            <LanguageSwitch locale={locale} onChange={setLocale} />

            <button
              type="button"
              onClick={executeScan}
              disabled={isScanning}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              {isScanning ? t.header.scanning : t.header.rescan}
            </button>
          </div>
        </header>

        {isScanning && !result ? (
          <div className="my-16 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-950/20 shadow-xl shadow-cyan-500/10">
              <ScanLine className="h-10 w-10 text-cyan-400 animate-pulse" aria-hidden="true" />
              <div className="absolute inset-0 animate-ping rounded-full border border-cyan-400/20" />
            </div>

            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {stage === 'probing' ? t.scan.probing : t.scan.analyzing}
            </h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
              {t.scan.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {PROBE_LIST.map((key) => {
                const elapsed = completedProbes[key];
                const done = elapsed !== undefined;
                return (
                  <div
                    key={key}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs transition-colors ${
                      done
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                    )}
                    <span className="font-medium">{t.scan.probes[key]}</span>
                    {done ? (
                      <span className="font-mono text-[10px] text-emerald-400/80">
                        {elapsed.toFixed(0)}ms
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {stage === 'error' ? (
          <div className="my-16 mx-auto max-w-md rounded-3xl border border-rose-500/30 bg-rose-950/20 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-white">{t.scan.failed}</h3>
            <p className="mt-2 text-xs text-rose-300/80">{errorMsg}</p>
            <button
              type="button"
              onClick={executeScan}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.scan.retry}
            </button>
          </div>
        ) : null}

        {result && payload ? (
          <main className="space-y-12">
            <HeroSummary result={result} t={t} locale={locale} />

            <LazySection>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Shield className="h-5 w-5" aria-hidden="true" />
                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                      {t.section.title}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{t.section.subtitle}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <GpuCard payload={payload} modules={moduleMap} t={t} />
                  <EnvCard payload={payload} modules={moduleMap} t={t} />
                  <AudioFontsCard payload={payload} modules={moduleMap} t={t} />
                </div>
              </div>
            </LazySection>

            <LazySection>
              <AdvisorSection
                result={result}
                t={t}
                onRescan={executeScan}
                isScanning={isScanning}
              />
            </LazySection>
          </main>
        ) : null}

        <footer className="mt-16 border-t border-slate-800/80 pt-6 pb-12 text-center text-xs text-slate-500">
          <p className="mx-auto max-w-2xl leading-relaxed">{t.footer}</p>
        </footer>
      </div>
    </div>
  );
}

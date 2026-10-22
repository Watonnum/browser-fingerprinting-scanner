'use client';

import { ExternalLink, RefreshCw, Shield, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { RiskAssessmentResult } from '@/types/fingerprint';
import { buildAdvisor, type AdvisorCard, type AdvisorFilter } from '@/lib/advisor';
import type { Dict } from '@/lib/i18n';
import { CopyButton } from './ui';

interface AdvisorSectionProps {
  result: RiskAssessmentResult;
  t: Dict;
  onRescan: () => void;
  isScanning: boolean;
}

const TABS: AdvisorFilter[] = ['all', 'firefox', 'brave', 'chromeSafari'];

export function AdvisorSection({ result, t, onRescan, isScanning }: AdvisorSectionProps) {
  const [activeTab, setActiveTab] = useState<AdvisorFilter>('all');
  const allCards = buildAdvisor(result.modules);
  const totalBits = Math.max(1, result.totalEntropyBits);

  const filteredCards = allCards.filter(
    (card) => activeTab === 'all' || card.filters.includes(activeTab),
  );

  return (
    <section aria-labelledby="advisor-title" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <h2 id="advisor-title" className="text-xl font-bold text-white sm:text-2xl">
              {t.advisor.title}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">{t.advisor.subtitle}</p>
        </div>

        <div
          role="tablist"
          aria-label="Browser filters"
          className="inline-flex self-start rounded-xl border border-slate-800 bg-slate-900/80 p-1"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-slate-700/90 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.advisor.tabs[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-8 text-center text-sm text-slate-400">
          {t.advisor.empty}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCards.map((card: AdvisorCard) => {
            const item = t.advisor.items[card.id];
            const percent = Math.min(
              100,
              Math.max(1, Math.round((card.reductionBits / totalBits) * 100)),
            );

            return (
              <article
                key={card.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                  card.recommended
                    ? 'border-amber-500/30 bg-linear-to-b from-amber-950/20 to-slate-900/50'
                    : card.maxProtection
                      ? 'border-emerald-500/30 bg-linear-to-b from-emerald-950/20 to-slate-900/50'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                      {card.tag}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {card.recommended ? (
                        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          {t.advisor.recommended}
                        </span>
                      ) : null}
                      {card.maxProtection ? (
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                          {t.advisor.maxProtection}
                        </span>
                      ) : (
                        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                          {t.advisor.reduce(percent)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{item.body}</p>
                  </div>

                  {card.code ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                      <code className="truncate font-mono text-xs text-cyan-300" title={card.code}>
                        {card.code}
                      </code>
                      <CopyButton
                        value={card.code}
                        label={t.copy}
                        copiedLabel={t.copied}
                        className="h-7 w-7"
                      />
                    </div>
                  ) : null}

                  {card.links && card.links.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {card.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:text-white"
                        >
                          {link.label}
                          <ExternalLink className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 border-t border-slate-800/60 pt-3">
                  <p className="text-[11px] text-slate-500">{item.note}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-linear-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/30 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white">{t.advisor.ctaTitle}</h3>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-400">{t.advisor.ctaBody}</p>
          </div>

          <button
            type="button"
            onClick={onRescan}
            disabled={isScanning}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {t.advisor.ctaButton}
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo } from "react";
import { Header } from "@/components/aruna/Header";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { PairIcon } from "@/components/aruna/PairIcon";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { RoleCard } from "@/components/aruna/RoleCard";
import { SectionHeader } from "@/components/aruna/SectionHeader";
import { HowItWorks } from "@/components/aruna/HowItWorks";
import { LineChart } from "@/components/aruna/charts/LineChart";
import { AppFooter } from "@/components/aruna/AppFooter";
import { marketDetailCopy, marketsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCompact, formatPercent, formatSampleTime } from "@/lib/format";
import { formatDuration } from "@/lib/contracts/units";
import { STRIKE_OPTIONS } from "@/lib/contracts/strikes";
import { chartGeometry, latestRealizedVol, realizedVolSeries, recentSamples } from "@/lib/vol-series";
import { useVault } from "@/hooks/useVaults";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import { usePricingVol } from "@/hooks/usePricingVol";
import { useProof } from "@/hooks/useProof";
import { useVaultYield } from "@/hooks/useVaultYield";
export function MarketDetailClient({ vaultId }: { vaultId: string }) {
  const { data: vault, isLoading: vaultLoading } = useVault(vaultId);
  const { status, headline, now } = useMarketStatus(vaultId);
  const pricingVol = usePricingVol(vaultId);
  const proof = useProof(vaultId).data;
  const yieldSummary = useVaultYield(vaultId).data;

  const samples = useMemo(
    () => (proof?.rows ?? []).map((row) => ({ timestamp: row.timestamp, cumulativeSumSq: row.cumulativeSumSq })),
    [proof?.rows],
  );
  const tenorSeconds = vault?.tenorSeconds ?? 0;
  const series = useMemo(
    () => realizedVolSeries(recentSamples(samples, now, tenorSeconds)),
    [samples, now, tenorSeconds],
  );
  const realizedNow = useMemo(() => latestRealizedVol(samples, now, tenorSeconds), [samples, now, tenorSeconds]);
  const geometry = useMemo(() => chartGeometry(series, STRIKE_OPTIONS, 700, 300), [series]);

  if (vaultLoading) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/markets")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading market…</p>
      </div>
    );
  }

  if (!vault || !vault.hasVault) {
    notFound();
  }

  const tenor = formatDuration(vault.tenorSeconds);
  const utilization = vault.totalCapitalUsdc > 0 ? vault.reservedCapacityUsdc / vault.totalCapitalUsdc : 0;
  const lastSampleAt = proof?.rows.at(-1)?.timestamp;
  const cycle = yieldSummary?.last ?? null;

  const opensIn = (at: number | null | undefined) => (at && now ? formatDuration(at - now) : "–");
  const depositCloses = status ? `in ${opensIn(status.deposit.closesAt)}` : "–";

  const protectNote = (() => {
    if (!status) return undefined;
    if (status.cover.canBuy) return undefined;
    if (status.phase === "not_started") return marketDetailCopy.protect.notYetNote(opensIn(status.cover.opensAt));
    return marketDetailCopy.protect.closedNote(opensIn(status.cover.opensAt));
  })();

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/markets")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col gap-[16px]">
        <Link href="/markets" className="text-[13px] text-foreground-muted hover:text-foreground w-fit">
          {marketDetailCopy.backLink}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[14px]">
          <div className="flex items-center gap-[14px] min-w-0">
            {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} size={32} /> : null}
            <h1 className="font-display text-[30px] lg:text-[36px] font-normal truncate">
              {vault.poolLabel} · {vault.poolFeeTier}
            </h1>
          </div>
          <span className="font-mono text-[12px] text-foreground-muted">{vault.chainLabel} · testnet</span>
        </div>

        <p className="text-[15px] leading-[1.6] text-foreground-secondary max-w-[760px]">
          {marketDetailCopy.describe(tenor)}
        </p>

        {headline ? (
          <div className="flex flex-wrap items-center gap-[12px]">
            <span className="text-[12px] tracking-[0.07em] uppercase text-foreground-muted">
              {marketDetailCopy.statusLabel}
            </span>
            <Badge label={headline.tag} tone={headline.tone} />
            <span className="text-[14px] text-foreground-secondary">{headline.text}</span>
          </div>
        ) : null}
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[24px]">
        <HowItWorks
          heading={marketsCopy.howItWorks.heading}
          steps={marketsCopy.howItWorks.steps.map((step) => ({ ...step }))}
          storageKey={marketDetailCopy.howItWorks.storageKey}
        />
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[20px] grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        <RoleCard
          role={marketDetailCopy.protect.role}
          title={marketDetailCopy.protect.title}
          description={marketDetailCopy.protect.description}
          stats={[
            {
              label: marketDetailCopy.protect.pricingVolLabel,
              value: formatPercent(pricingVol.volPercent),
              hint: marketDetailCopy.protect.pricingVolHint,
            },
            { label: marketDetailCopy.protect.freeLabel, value: formatCompact(vault.freeCapacityUsdc, "USDC") },
            {
              label: marketDetailCopy.protect.buyUntilLabel,
              value:
                status?.cover.canBuy && status.cover.buyUntil ? `${opensIn(status.cover.buyUntil)} left` : marketDetailCopy.protect.buyUntilClosed,
              tone: status?.cover.canBuy ? "positive" : "neutral",
            },
          ]}
          note={marketDetailCopy.protect.note}
          cta={{
            label: marketDetailCopy.protect.cta,
            href: "/protect",
            disabled: !status?.cover.canBuy,
          }}
          ctaNote={protectNote}
        />

        <RoleCard
          role={marketDetailCopy.underwrite.role}
          title={marketDetailCopy.underwrite.title}
          description={marketDetailCopy.underwrite.description}
          stats={[
            {
              label: marketDetailCopy.underwrite.lastCycleLabel,
              value: cycle && cycle.percent !== null ? formatPercent(cycle.percent, { signed: true }) : marketDetailCopy.underwrite.noCycleYet,
              tone: cycle && cycle.percent !== null ? (cycle.percent >= 0 ? "positive" : "negative") : "neutral",
              hint: marketDetailCopy.underwrite.lastCycleHint,
            },
            { label: marketDetailCopy.underwrite.depositsCloseLabel, value: depositCloses },
          ]}
          note={marketDetailCopy.underwrite.note}
          cta={{ label: marketDetailCopy.underwrite.cta, href: `/underwrite/${vault.id}/deposit` }}
        />
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[40px]">
        <SectionHeader title={marketDetailCopy.volatility.title} description={marketDetailCopy.volatility.description} />
        <Card>
          {series.length >= 2 && proof ? (
            <>
              <div className="flex flex-wrap justify-between gap-[12px] font-mono text-[12px]">
                <span className="text-accent">{marketDetailCopy.volatility.legendRealized(formatDuration(tenorSeconds))}</span>
                <span className="text-foreground-muted">{marketDetailCopy.volatility.legendStrike}</span>
              </div>
              <LineChart
                viewBoxWidth={700}
                viewBoxHeight={300}
                className="w-full h-[260px] pt-[12px]"
                ariaLabel={`Realized volatility ${realizedNow ?? "unavailable"} percent over the last cohort, against strike levels`}
                series={[{ points: geometry.points, tone: "accent", markerAtEnd: true }]}
                thresholds={geometry.thresholds.map((t) => ({ ...t, tone: "neutral" as const }))}
              />
            </>
          ) : (
            <div className="py-[36px] text-center text-[14px] text-foreground-muted">{marketDetailCopy.volatility.empty}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] border-t border-border mt-[18px] pt-[16px]">
            <div>
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">Realized vol</div>
              <div className="font-mono text-[18px] pt-[6px]">{formatPercent(realizedNow)}</div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">Last sample</div>
              <div className="font-mono text-[14px] pt-[8px]">{lastSampleAt ? formatSampleTime(lastSampleAt) + " UTC" : "–"}</div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">Sampling</div>
              <div className="text-[13px] pt-[8px] text-foreground-secondary">
                {proof ? marketDetailCopy.volatility.recorded(proof.samplesRecorded) : "–"}
                {proof?.gapCount ? <span className="block text-foreground-muted">{marketDetailCopy.volatility.gaps(proof.gapCount)}</span> : null}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[40px] pb-[48px] grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        <section>
          <SectionHeader title={marketDetailCopy.capacity.title} description={marketDetailCopy.capacity.description} />
          <Card>
            <div className="font-mono text-[28px]">
              {formatCompact(vault.freeCapacityUsdc, "USDC")}
            </div>
            <div className="text-[13px] text-foreground-muted pt-[2px]">{marketDetailCopy.capacity.freeLabel}</div>
            <div className="pt-[16px]">
              <ProgressBar value={utilization} />
            </div>
            <div className="flex justify-between font-mono text-[12px] text-foreground-muted pt-[8px]">
              <span>
                {formatCompact(vault.reservedCapacityUsdc, "USDC")} {marketDetailCopy.capacity.reservedLabel.toLowerCase()}
              </span>
              <span>
                {formatCompact(vault.totalCapitalUsdc, "USDC")} {marketDetailCopy.capacity.totalLabel.toLowerCase()}
              </span>
            </div>
            <p className="text-[13.5px] leading-[1.6] text-foreground-secondary border-t border-border mt-[16px] pt-[14px]">
              {marketDetailCopy.capacity.note}
            </p>
          </Card>
        </section>

        <section>
          <SectionHeader title={marketDetailCopy.history.title} description={marketDetailCopy.history.description} />
          <Card padding="sm">
            {yieldSummary && yieldSummary.recent.length > 0 ? (
              <div className="flex flex-col">
                <div className="grid grid-cols-5 gap-[8px] px-[4px] pb-[10px] text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                  <span>{marketDetailCopy.history.columns.cohort}</span>
                  <span className="text-right">{marketDetailCopy.history.columns.capital}</span>
                  <span className="text-right">{marketDetailCopy.history.columns.premiums}</span>
                  <span className="text-right">{marketDetailCopy.history.columns.claims}</span>
                  <span className="text-right">{marketDetailCopy.history.columns.result}</span>
                </div>
                {yieldSummary.recent.map((row) => (
                  <div key={row.cohortId} className="grid grid-cols-5 gap-[8px] px-[4px] py-[12px] border-t border-border font-mono text-[13px] items-center">
                    <span>Cohort {row.cohortId}</span>
                    <span className="text-right">{formatCompact(row.capitalUsdc)}</span>
                    <span className="text-right">{formatCompact(row.premiumsUsdc)}</span>
                    <span className="text-right">{formatCompact(row.claimsUsdc)}</span>
                    <span className={["text-right", row.netUsdc >= 0 ? "text-positive" : "text-negative"].join(" ")}>
                      {formatPercent(row.percent, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-[28px] text-center text-[14px] text-foreground-muted">{marketDetailCopy.history.empty}</div>
            )}
          </Card>
        </section>
      </div>

      <AppFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { PairIcon } from "@/components/aruna/PairIcon";
import { lpMyCoversCopy, lpSettlementCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdcDecimal } from "@/lib/format";
import { useCoversByWallet, usePositions } from "@/hooks/usePosition";
import { useVault } from "@/hooks/useVaults";
import { useWallet } from "@/hooks/useWallet";

export default function MyCoversPage() {
  const { address } = useWallet();
  const positions = usePositions().data ?? [];
  const { data: covers, isLoading, isError } = useCoversByWallet(address);
  // Only one real vault right now; its label is a reasonable stand-in until
  // covers can come from more than one vault at once.
  const vault = useVault(covers?.[0]?.vaultId ?? "").data;

  // Active covers first — what's still running is what you'd check most often.
  const sortedCovers = [...(covers ?? [])].sort((a, b) =>
    a.status === "active" && b.status !== "active" ? -1 : b.status === "active" && a.status !== "active" ? 1 : 0,
  );

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[26px]">
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal">{lpMyCoversCopy.heading}</h1>
        <p className="text-[15px] text-foreground-secondary pt-[8px]">{lpMyCoversCopy.subtitle}</p>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[26px] flex flex-col gap-[14px] flex-grow">
        {isError ? <p className="text-[14px] text-negative">Could not load your covers from the indexer.</p> : null}
        {address && isLoading ? <p className="text-[14px] text-foreground-muted">Loading your covers…</p> : null}

        {sortedCovers.length === 0 && !isLoading ? (
          <Card className="flex flex-col items-start gap-[14px]">
            <span className="text-[14.5px] text-foreground-secondary">{lpMyCoversCopy.emptyState}</span>
            <Button href="/protect">{lpMyCoversCopy.emptyStateCta}</Button>
          </Card>
        ) : (
          sortedCovers.map((cover) => {
            const position = positions.find((item) => item.tokenId === cover.positionId);
            const poolLabel = vault ? `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}` : cover.vaultId;
            // Only an Active policy is a running cover; every other status is over.
            const isSettled = cover.status !== "active";
            const badgeTone = cover.status === "paid_out" ? "positive" : cover.status === "active" ? "accent" : "neutral";
            const badgeLabel =
              cover.status === "paid_out"
                ? lpSettlementCopy.badgePaidOut
                : cover.status === "no_payout"
                  ? lpSettlementCopy.badgeNoPayout
                  : cover.status === "refunded"
                    ? lpMyCoversCopy.badgeRefunded
                    : cover.status === "cancelled"
                      ? lpMyCoversCopy.badgeCancelled
                      : lpMyCoversCopy.badgeActive;
            // A cancelled cover has neither an active nor a settlement screen, so it gets no link.
            const hasLink = cover.status !== "cancelled";
            const hasResult = cover.netResultUsdc !== null;
            const href = isSettled ? `/protect/${cover.positionId}/settlement` : `/protect/${cover.positionId}/active`;
            const cta = isSettled ? lpMyCoversCopy.viewSettlementCta : lpMyCoversCopy.viewCoverCta;

            return (
              <Card
                key={cover.id}
                variant={cover.status === "active" ? "raised" : "default"}
                className="flex flex-col sm:flex-row justify-between sm:items-center gap-[16px]"
              >
                <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[10px] flex-wrap">
                    {vault?.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} /> : null}
                    <span className="text-[17px] font-semibold">{lpMyCoversCopy.coverTitle(cover.id)}</span>
                    {position ? (
                      <span className="font-mono text-[12px] text-foreground-muted">
                        position #{position.tokenId}
                      </span>
                    ) : null}
                    <Badge label={badgeLabel} tone={badgeTone} />
                  </div>
                  <div className="font-mono text-[13px] text-foreground-secondary">
                    {lpMyCoversCopy.cardMeta(poolLabel, cover.strikePercent, formatUsdcDecimal(cover.capUsdc))}
                  </div>
                  <div className="font-mono text-[12px] text-foreground-muted">
                    {cover.status === "cancelled"
                      ? lpMyCoversCopy.cancelledCaption
                      : isSettled
                        ? lpMyCoversCopy.settledCaption(cover.settledAt ? formatSettlementDate(cover.settledAt) : "—")
                        : lpMyCoversCopy.pendingSettlement}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-[16px] sm:gap-[28px]">
                  <div className="text-right">
                    <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                      {hasResult ? lpMyCoversCopy.netResultLabel : lpMyCoversCopy.premiumPaidLabel}
                    </div>
                    <div
                      className={`font-mono text-[20px] pt-[4px] ${
                        hasResult
                          ? (cover.netResultUsdc ?? 0) >= 0
                            ? "text-positive"
                            : "text-negative"
                          : "text-foreground"
                      }`}
                    >
                      {hasResult
                        ? `${(cover.netResultUsdc ?? 0) >= 0 ? "+" : "-"}${formatUsdcDecimal(Math.abs(cover.netResultUsdc ?? 0))}`
                        : `-${formatUsdcDecimal(cover.premiumUsdc)}`}
                    </div>
                  </div>
                  {hasLink ? (
                    <Button href={href} variant={cover.status === "active" ? "primary" : "ghost"} className="w-full sm:w-auto">
                      {cta}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })
        )}

        <Link href="/protect" className="text-[13px] text-foreground-muted mt-auto pt-[8px]">
          {lpMyCoversCopy.backLink}
        </Link>
      </div>
    </div>
  );
}

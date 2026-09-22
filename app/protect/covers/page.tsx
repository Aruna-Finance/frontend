import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { lpMyCoversCopy, lpSettlementCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdcDecimal } from "@/lib/format";
import { usePositions } from "@/hooks/usePosition";
import { useVault } from "@/hooks/useVaults";
import { useWallet } from "@/hooks/useWallet";
import { mockPositionCovers } from "@/lib/mock/positions";

export default function MyCoversPage() {
  const wallet = useWallet();
  const positions = usePositions().data ?? [];
  const vault = useVault("weth-usdc-005").data;

  // Active covers first — what's still running is what you'd check most often.
  const covers = [...mockPositionCovers].sort((a, b) =>
    a.status === "active" && b.status !== "active" ? -1 : b.status === "active" && a.status !== "active" ? 1 : 0,
  );

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[26px]">
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal">{lpMyCoversCopy.heading}</h1>
        <p className="text-[15px] text-foreground-secondary pt-[8px]">{lpMyCoversCopy.subtitle}</p>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[26px] flex flex-col gap-[14px] flex-grow">
        {covers.length === 0 ? (
          <Card className="flex flex-col items-start gap-[14px]">
            <span className="text-[14.5px] text-foreground-secondary">{lpMyCoversCopy.emptyState}</span>
            <Button href="/protect">{lpMyCoversCopy.emptyStateCta}</Button>
          </Card>
        ) : (
          covers.map((cover) => {
            const position = positions.find((item) => item.tokenId === cover.positionId);
            const poolLabel = vault ? `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}` : cover.vaultId;
            const isSettled = cover.settledAt !== null;
            const badgeTone = cover.status === "paid_out" ? "positive" : cover.status === "no_payout" ? "neutral" : "accent";
            const badgeLabel =
              cover.status === "paid_out"
                ? lpSettlementCopy.badgePaidOut
                : cover.status === "no_payout"
                  ? lpSettlementCopy.badgeNoPayout
                  : lpMyCoversCopy.badgeActive;
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
                    {isSettled
                      ? lpMyCoversCopy.settledCaption(formatSettlementDate(cover.settledAt!))
                      : lpMyCoversCopy.pendingSettlement}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-[16px] sm:gap-[28px]">
                  <div className="text-right">
                    <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                      {isSettled ? lpMyCoversCopy.netResultLabel : lpMyCoversCopy.premiumPaidLabel}
                    </div>
                    <div
                      className={`font-mono text-[20px] pt-[4px] ${
                        isSettled
                          ? (cover.netResultUsdc ?? 0) >= 0
                            ? "text-positive"
                            : "text-negative"
                          : "text-foreground"
                      }`}
                    >
                      {isSettled
                        ? `${(cover.netResultUsdc ?? 0) >= 0 ? "+" : "-"}${formatUsdcDecimal(Math.abs(cover.netResultUsdc ?? 0))}`
                        : `-${formatUsdcDecimal(cover.premiumUsdc)}`}
                    </div>
                  </div>
                  <Button href={href} variant={cover.status === "active" ? "primary" : "ghost"} className="w-full sm:w-auto">
                    {cta}
                  </Button>
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

import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { StepIndicator } from "@/components/aruna/StepIndicator";
import { lpSelectPositionCopy, stepIndicatorCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { usePositions } from "@/hooks/usePosition";
import { useWallet } from "@/hooks/useWallet";
import { mockCohortTimeRemaining } from "@/lib/mock/cohorts";
import { formatRangeValue, formatUsd } from "@/lib/format";

export default function ProtectSelectPositionPage() {
  const wallet = useWallet();
  const positions = usePositions().data ?? [];
  const featuredVault = useVault("weth-usdc-005").data;
  const featuredCohort = useCohort("weth-usdc-005").data;
  const timeLeft = featuredCohort ? mockCohortTimeRemaining[featuredCohort.id] : undefined;

  const firstEligibleIndex = positions.findIndex((position) => position.hasVaultForPool);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[26px]">
        <StepIndicator
          steps={[stepIndicatorCopy.position, stepIndicatorCopy.cover, stepIndicatorCopy.confirm]}
          currentIndex={0}
        />
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-[12px]">
          <div>
            <h1 className="font-display text-[32px] lg:text-[36px] font-normal pt-[14px]">
              {lpSelectPositionCopy.heading}
            </h1>
            <p className="text-[15px] text-foreground-secondary pt-[8px]">{lpSelectPositionCopy.subtitle}</p>
          </div>
          <Button variant="ghost" href="/protect/covers" className="shrink-0">
            {lpSelectPositionCopy.myCoversCta}
          </Button>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[26px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[14px]">
          {positions.map((position, index) => {
            const highlighted = index === firstEligibleIndex;
            const quoteHref = `/protect/${position.tokenId}/quote`;

            return (
              <Card
                key={position.tokenId}
                variant={highlighted ? "raised" : "default"}
                className={`flex flex-col sm:flex-row justify-between sm:items-center gap-[16px] ${
                  position.hasVaultForPool ? "" : "opacity-60"
                }`}
              >
                <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[10px] flex-wrap">
                    <span className="text-[17px] font-semibold">
                      {position.poolLabel} {position.poolFeeTier}
                    </span>
                    <span className="font-mono text-[12px] text-foreground-muted">#{position.tokenId}</span>
                    {position.inRange !== null ? (
                      <Badge
                        label={position.inRange ? lpSelectPositionCopy.badgeInRange : lpSelectPositionCopy.badgeOutOfRange}
                        tone={position.inRange ? "positive" : "negative"}
                      />
                    ) : null}
                  </div>
                  <div className="font-mono text-[13px] text-foreground-secondary">
                    {lpSelectPositionCopy.positionMeta(
                      formatRangeValue(position.rangeLowerUsdc),
                      formatRangeValue(position.rangeUpperUsdc),
                      position.feesEarnedUsdc.toFixed(2),
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-[28px]">
                  <div className="text-right">
                    <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                      {lpSelectPositionCopy.positionValueLabel}
                    </div>
                    <div className="font-mono text-[22px] pt-[4px]">{formatUsd(position.valueUsdc)}</div>
                  </div>
                  {position.hasVaultForPool ? (
                    <Button href={quoteHref} variant={highlighted ? "primary" : "ghost"}>
                      {lpSelectPositionCopy.selectCta}
                    </Button>
                  ) : (
                    <Button disabled>{lpSelectPositionCopy.noVaultForPoolCta}</Button>
                  )}
                </div>
              </Card>
            );
          })}

          <div className="border border-dashed border-border rounded-card px-[24px] py-[20px] flex flex-col sm:flex-row justify-between sm:items-center gap-[12px]">
            <span className="text-[14px] text-foreground-muted">{lpSelectPositionCopy.manualEntry.prompt}</span>
            <div className="flex gap-[10px] items-center">
              <label htmlFor="tokenid" className="text-[13px] text-foreground-muted">
                {lpSelectPositionCopy.manualEntry.label}
              </label>
              <input
                id="tokenid"
                type="text"
                placeholder={lpSelectPositionCopy.manualEntry.placeholder}
                className="h-[44px] w-[160px] px-[12px] rounded-control border border-border bg-canvas text-foreground font-mono text-[14px]"
              />
              <Button variant="ghost" size="sm">
                {lpSelectPositionCopy.manualEntry.loadCta}
              </Button>
            </div>
          </div>
        </div>

        <Card className="w-full lg:w-[340px] lg:shrink-0 flex flex-col gap-[16px]">
          <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
            {lpSelectPositionCopy.sidebar.label}
          </div>
          <p className="text-[14.5px] leading-[1.65] text-foreground-secondary">{lpSelectPositionCopy.sidebar.p1}</p>
          <p className="text-[14.5px] leading-[1.65] text-foreground-secondary">{lpSelectPositionCopy.sidebar.p2}</p>
          {timeLeft ? (
            <p className="text-[14.5px] leading-[1.65] text-foreground-secondary border-t border-border pt-[16px]">
              {lpSelectPositionCopy.sidebar.p3(timeLeft)}
            </p>
          ) : null}
          {featuredVault ? (
            <Link href={`/markets/${featuredVault.id}`} className="mt-auto text-[13px] text-foreground-muted">
              {lpSelectPositionCopy.sidebar.seeMarketLink}
            </Link>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

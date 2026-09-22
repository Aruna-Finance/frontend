import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { uwMyPositionsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdcDecimal } from "@/lib/format";
import { useVaults } from "@/hooks/useVaults";
import { useWallet } from "@/hooks/useWallet";
import { mockUnderwriterPositions } from "@/lib/mock/vaults";

const DASHBOARD_MODELED_VAULT_ID = "weth-usdc-005";

export default function MyUnderwritingPositionsPage() {
  const wallet = useWallet();
  const vaults = useVaults().data ?? [];

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[26px]">
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal">{uwMyPositionsCopy.heading}</h1>
        <p className="text-[15px] text-foreground-secondary pt-[8px]">{uwMyPositionsCopy.subtitle}</p>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[26px] flex flex-col gap-[14px] flex-grow">
        {mockUnderwriterPositions.length === 0 ? (
          <Card className="flex flex-col items-start gap-[14px]">
            <span className="text-[14.5px] text-foreground-secondary">{uwMyPositionsCopy.emptyState}</span>
            <Button href="/underwrite">{uwMyPositionsCopy.emptyStateCta}</Button>
          </Card>
        ) : (
          mockUnderwriterPositions.map((position) => {
            const vault = vaults.find((item) => item.id === position.vaultId);
            const poolLabel = vault ? `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}` : position.vaultId;
            const dashboardAvailable = position.vaultId === DASHBOARD_MODELED_VAULT_ID;

            return (
              <Card
                key={position.vaultId}
                variant={dashboardAvailable ? "raised" : "default"}
                className="flex flex-col sm:flex-row justify-between sm:items-center gap-[16px]"
              >
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[17px] font-semibold">{poolLabel}</span>
                  <div className="font-mono text-[13px] text-foreground-secondary">
                    {uwMyPositionsCopy.cardMeta(position.cohortId, position.sharePercent)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-[16px] sm:gap-[28px]">
                  <div className="flex gap-[24px]">
                    <div className="text-right">
                      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                        {uwMyPositionsCopy.capitalLabel}
                      </div>
                      <div className="font-mono text-[20px] pt-[4px]">
                        {formatUsdcDecimal(position.capitalCommittedUsdc)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                        {uwMyPositionsCopy.markLabel}
                      </div>
                      <div
                        className={`font-mono text-[20px] pt-[4px] ${
                          position.markIfEndsHereUsdc >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {position.markIfEndsHereUsdc >= 0 ? "+" : ""}
                        {formatUsdcDecimal(position.markIfEndsHereUsdc)}
                      </div>
                    </div>
                  </div>
                  {dashboardAvailable ? (
                    <Button href={`/underwrite/${position.vaultId}/dashboard`} className="w-full sm:w-auto">
                      {uwMyPositionsCopy.viewDashboardCta}
                    </Button>
                  ) : (
                    <Button disabled className="w-full sm:w-auto">
                      {uwMyPositionsCopy.dashboardUnavailable}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}

        <Link href="/underwrite" className="text-[13px] text-foreground-muted mt-auto pt-[8px]">
          {uwMyPositionsCopy.backLink}
        </Link>
      </div>
    </div>
  );
}

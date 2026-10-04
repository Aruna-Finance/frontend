"use client";

import { Header } from "@/components/aruna/Header";
import { CohortTimeline } from "@/components/aruna/demo/CohortTimeline";
import { FaucetPanel } from "@/components/aruna/demo/FaucetPanel";
import { KeeperPanel } from "@/components/aruna/demo/KeeperPanel";
import { Card } from "@/components/aruna/Card";
import { demoCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { demoVault, useDemoMarket } from "@/hooks/useDemoMarket";

export default function DemoConsolePage() {
  const market = useDemoMarket();

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/demo")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[26px]">
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal">{demoCopy.heading}</h1>
        <p className="text-[15px] text-foreground-secondary pt-[8px] max-w-[720px]">{demoCopy.subtitle}</p>
        <p className="text-[13px] text-foreground-muted pt-[10px] max-w-[720px]">{demoCopy.sharedMarketWarning}</p>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[26px] flex flex-col gap-[20px] flex-grow">
        {market.isError ? (
          <p className="text-[14px] text-negative">Could not load the market from the indexer.</p>
        ) : null}
        {market.isLoading ? <p className="text-[14px] text-foreground-muted">Loading market…</p> : null}

        {market.timeline ? (
          <CohortTimeline entries={market.timeline} now={market.now} policyCap={market.policyCap} />
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
          <KeeperPanel
            vault={demoVault}
            readiness={market.readiness}
            events={market.events}
            onChanged={() => void market.refetchLastSample()}
          />
          <FaucetPanel />
          <Card className="flex flex-col gap-[8px]">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.comingSoon}</div>
            <p className="text-[14px] text-foreground-secondary">Storm / Calm price controls.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { formatEther } from "viem";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { demoCopy } from "@/lib/content/copy";
import { shortenAddress } from "@/lib/format";
import { useStorm } from "@/hooks/useStorm";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";

export function StormPanel({ sampleInterval }: { sampleInterval: number | undefined }) {
  const { isConnected } = useWallet();
  const walletModal = useWalletModal();
  const storm = useStorm(sampleInterval);
  const stormOn = storm.mode === "storm";

  return (
    <Card variant={stormOn ? "raised" : "default"} className="flex flex-col gap-[16px]">
      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.storm.label}</div>
      <p className="text-[14px] leading-[1.6] text-foreground-secondary">{demoCopy.storm.body}</p>

      <div className="grid grid-cols-2 gap-[10px]">
        <Button type="button" variant={stormOn ? "ghost" : "primary"} onClick={() => storm.setMode("calm")}>
          {demoCopy.storm.calm}
        </Button>
        <Button
          type="button"
          variant={stormOn ? "primary" : "ghost"}
          disabled={!storm.canStorm}
          onClick={() => storm.setMode("storm")}
        >
          {demoCopy.storm.storm}
        </Button>
      </div>
      {!storm.canStorm ? <span className="text-[12.5px] text-foreground-muted">{demoCopy.storm.needsFunds}</span> : null}

      <p className="text-[12.5px] leading-[1.55] text-foreground-muted">
        {demoCopy.storm.shared} {demoCopy.storm.tabOnly}
      </p>

      <div className="border-t border-border pt-[14px] flex flex-col gap-[8px]">
        <div className="text-[12px] text-foreground-muted">{demoCopy.storm.burnerLabel}</div>
        <div className="font-mono text-[12.5px] text-foreground-secondary">
          {storm.burnerAddress ? shortenAddress(storm.burnerAddress) : "—"} ·{" "}
          {storm.ethBalance !== undefined ? `${Number(formatEther(storm.ethBalance)).toFixed(4)} ETH` : "—"}
        </div>
        <p className="text-[12.5px] leading-[1.55] text-foreground-muted">{demoCopy.storm.burnerHelp}</p>
        <div className="flex flex-col sm:flex-row gap-[8px]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={storm.busy}
            onClick={() => (isConnected ? void storm.fundBurner() : walletModal.open())}
          >
            {isConnected ? demoCopy.storm.fund : demoCopy.storm.connectFirst}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={storm.busy || !isConnected} onClick={() => void storm.sweepBurner()}>
            {demoCopy.storm.sweep}
          </Button>
        </div>
      </div>

      {storm.log.length > 0 ? (
        <div className="border-t border-border pt-[14px] flex flex-col gap-[4px]">
          <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.storm.logLabel}</div>
          {storm.log.map((line) => (
            <span
              key={line.at}
              className={`font-mono text-[12px] ${line.tone === "error" ? "text-negative" : "text-foreground-secondary"}`}
            >
              {new Date(line.at).toLocaleTimeString()} · {line.text}
            </span>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

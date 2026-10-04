"use client";

import { formatEther, formatUnits } from "viem";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { demoCopy } from "@/lib/content/copy";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import { ETH_FAUCET_LINKS, type FaucetStepId } from "@/lib/demo/faucet";
import { formatTokenNumber } from "@/lib/format";
import { useFaucet } from "@/hooks/useFaucet";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";

const STEP_LABELS: Record<FaucetStepId, string> = {
  mintUsdc: demoCopy.faucet.steps.mintUsdc,
  mintWeth: demoCopy.faucet.steps.mintWeth,
  approveUsdc: demoCopy.faucet.steps.approveUsdc,
  approveWeth: demoCopy.faucet.steps.approveWeth,
  mintPosition: demoCopy.faucet.steps.mintPosition,
};

export function FaucetPanel() {
  const { isConnected } = useWallet();
  const walletModal = useWalletModal();
  const faucet = useFaucet();
  const running = faucet.status === "running";

  return (
    <Card className="flex flex-col gap-[16px]">
      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.faucet.label}</div>
      <p className="text-[14px] leading-[1.6] text-foreground-secondary">{demoCopy.faucet.body}</p>

      {isConnected ? (
        <div className="font-mono text-[12.5px] text-foreground-muted flex flex-col gap-[2px]">
          <span>mUSDC {faucet.usdcBalance !== undefined ? formatTokenNumber(Number(formatUnits(faucet.usdcBalance, USDC_DECIMALS))) : "-"}</span>
          <span>mWETH {faucet.wethBalance !== undefined ? formatTokenNumber(Number(formatUnits(faucet.wethBalance, 18))) : "-"}</span>
          <span>ETH {faucet.ethBalance !== undefined ? Number(formatEther(faucet.ethBalance)).toFixed(4) : "-"}</span>
        </div>
      ) : null}

      {faucet.lowGas ? (
        <div className="rounded-control bg-negative-soft p-[12px] flex flex-col gap-[6px]">
          <span className="text-[13px] text-negative">{demoCopy.faucet.needGas}</span>
          {ETH_FAUCET_LINKS.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-[13px] underline">
              {link.label}
            </a>
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        disabled={running}
        onClick={() => (isConnected ? void faucet.start() : walletModal.open())}
      >
        {running ? demoCopy.faucet.running : faucet.status === "failed" ? demoCopy.faucet.resume : demoCopy.faucet.cta}
      </Button>

      {faucet.progress.steps.length > 0 ? (
        <ol className="flex flex-col gap-[6px] font-mono text-[12.5px]">
          {faucet.progress.steps.map((step) => {
            const done = faucet.progress.done.has(step.id);
            const failed = faucet.progress.failedStep === step.id;
            return (
              <li key={step.id} className={done ? "text-positive" : failed ? "text-negative" : "text-foreground-muted"}>
                {done ? "✓" : failed ? "✗" : "·"} {STEP_LABELS[step.id]}
              </li>
            );
          })}
        </ol>
      ) : null}

      {faucet.status === "done" ? (
        <p className="text-[13.5px] text-positive">
          {demoCopy.faucet.done} <a href="/protect" className="underline">{demoCopy.faucet.doneLink}</a>
        </p>
      ) : null}
    </Card>
  );
}

"use client";

import type { Address } from "viem";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { demoCopy } from "@/lib/content/copy";
import { explorerTxUrl } from "@/lib/contracts/config";
import { formatCountdown } from "@/lib/demo/countdown";
import type { KeeperReadiness } from "@/lib/demo/timeline";
import type { IndexerKeeperEvent } from "@/lib/indexer/types";
import { shortenAddress } from "@/lib/format";
import { useKeeperActions } from "@/hooks/useKeeperActions";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";

export function KeeperPanel({
  vault,
  readiness,
  events,
  onChanged,
}: {
  vault: Address;
  readiness: KeeperReadiness | undefined;
  events: IndexerKeeperEvent[];
  onChanged: () => void;
}) {
  const { isConnected } = useWallet();
  const walletModal = useWalletModal();
  const { poke, finalize, settleBatch, isPending } = useKeeperActions(vault);

  const run = async (action: () => Promise<boolean>) => {
    if (!isConnected) {
      walletModal.open();
      return;
    }
    if (await action()) onChanged();
  };

  const idle = readiness && !readiness.finalizeCohort && !readiness.settleCohort;

  return (
    <Card className="flex flex-col gap-[16px]">
      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.keeper.label}</div>
      <p className="text-[14px] leading-[1.6] text-foreground-secondary">{demoCopy.keeper.body}</p>

      <div className="flex flex-col gap-[10px]">
        <Button type="button" variant="ghost" disabled={isPending || !readiness?.pokeDue} onClick={() => run(poke)}>
          {demoCopy.keeper.poke}
        </Button>
        <span className="font-mono text-[12px] text-foreground-muted">
          {readiness
            ? readiness.pokeDue
              ? demoCopy.keeper.pokeReady
              : demoCopy.keeper.pokeIn(formatCountdown(readiness.secondsToPoke))
            : "—"}
        </span>

        {readiness?.finalizeCohort != null ? (
          <Button type="button" disabled={isPending} onClick={() => run(() => finalize(readiness.finalizeCohort!))}>
            {demoCopy.keeper.finalize(readiness.finalizeCohort)}
          </Button>
        ) : null}
        {readiness?.settleCohort != null ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run(() => settleBatch(readiness.settleCohort!, readiness.settleCount))}
          >
            {demoCopy.keeper.settle(readiness.settleCohort, readiness.settleCount)}
          </Button>
        ) : null}
        {idle ? <span className="text-[13px] text-foreground-muted">{demoCopy.keeper.nothing}</span> : null}
      </div>

      <div className="border-t border-border pt-[14px] flex flex-col gap-[8px]">
        <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{demoCopy.keeper.recent}</div>
        {events.length === 0 ? (
          <span className="text-[13px] text-foreground-muted">{demoCopy.keeper.noEvents}</span>
        ) : (
          events.map((event) => (
            <a
              key={event.id}
              href={explorerTxUrl(event.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[12px] text-foreground-secondary hover:text-foreground flex justify-between gap-[8px]"
            >
              <span>{event.kind}</span>
              <span className="text-foreground-muted">{event.actor ? shortenAddress(event.actor) : "—"}</span>
            </a>
          ))
        )}
      </div>
    </Card>
  );
}

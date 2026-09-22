import { notFound } from "next/navigation";
import { usePosition } from "@/hooks/usePosition";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { mockCohortTimeRemaining } from "@/lib/mock/cohorts";
import { mockQuoteDefaults } from "@/lib/mock/positions";
import { QuoteClient } from "./QuoteClient";

export default async function LPQuotePage(props: PageProps<"/protect/[positionId]/quote">) {
  const { positionId } = await props.params;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const position = usePosition(positionId).data;

  if (!position || !position.hasVaultForPool) {
    notFound();
  }

  // The quote table in lib/mock/positions.ts is calibrated for one vault
  // (weth-usdc-005) — every coverable position today belongs to it.
  const vaultId = mockQuoteDefaults.vaultId;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const vault = useVault(vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohort = useCohort(vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

  if (!vault || !cohort) {
    notFound();
  }

  const timeLeft = mockCohortTimeRemaining[cohort.id] ?? "";

  return (
    <QuoteClient
      positionId={positionId}
      position={position}
      vault={vault}
      cohortId={cohort.id}
      timeLeft={timeLeft}
      realizedVolPercent={cohort.realizedVolPercent}
      walletAddress={wallet.address}
    />
  );
}

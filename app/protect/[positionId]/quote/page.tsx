import { notFound } from "next/navigation";
import { findMockCohort, findMockPosition, findMockVault } from "@/lib/mock/lookup";
import { mockCohortTimeRemaining } from "@/lib/mock/cohorts";
import { mockQuoteDefaults } from "@/lib/mock/positions";
import { QuoteClient } from "./QuoteClient";

export default async function LPQuotePage(props: PageProps<"/protect/[positionId]/quote">) {
  const { positionId } = await props.params;
  const position = findMockPosition(positionId);

  if (!position || !position.hasVaultForPool) {
    notFound();
  }

  // The quote table in lib/mock/positions.ts is calibrated for one vault
  // (weth-usdc-005) — every coverable position today belongs to it.
  const vaultId = mockQuoteDefaults.vaultId;
  const vault = findMockVault(vaultId);
  const cohort = findMockCohort(vaultId);

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
    />
  );
}

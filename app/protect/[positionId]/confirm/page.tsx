import { notFound } from "next/navigation";
import { findMockCohort, findMockPosition, findMockVault } from "@/lib/mock/lookup";
import { useQuote } from "@/hooks/useQuote";
import { mockQuoteDefaults } from "@/lib/mock/positions";
import { ConfirmClient } from "./ConfirmClient";

const VALID_STRIKES = [30, 35, 45, 55];

export default async function LPConfirmPage(props: PageProps<"/protect/[positionId]/confirm">) {
  const { positionId } = await props.params;
  const searchParams = await props.searchParams;
  const requestedStrike = Number(searchParams.strike);
  const strikePercent = VALID_STRIKES.includes(requestedStrike) ? requestedStrike : 35;

  const position = findMockPosition(positionId);

  if (!position || !position.hasVaultForPool) {
    notFound();
  }

  const vaultId = mockQuoteDefaults.vaultId;
  const vault = findMockVault(vaultId);
  const cohort = findMockCohort(vaultId);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const quote = useQuote({ vaultId, strikePercent, coveredAmountUsdc: mockQuoteDefaults.coveredAmountUsdc }).data;

  if (!vault || !cohort || !quote) {
    notFound();
  }

  return (
    <ConfirmClient
      positionId={positionId}
      vault={vault}
      cohortEndsAt={cohort.endsAt}
      quote={quote}
      coveredAmountUsdc={mockQuoteDefaults.coveredAmountUsdc}
    />
  );
}

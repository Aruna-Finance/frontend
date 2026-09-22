import { notFound } from "next/navigation";
import { usePosition } from "@/hooks/usePosition";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { useQuote } from "@/hooks/useQuote";
import { useWallet } from "@/hooks/useWallet";
import { mockQuoteDefaults } from "@/lib/mock/positions";
import { ConfirmClient } from "./ConfirmClient";

const VALID_STRIKES = [30, 35, 45, 55];

export default async function LPConfirmPage(props: PageProps<"/protect/[positionId]/confirm">) {
  const { positionId } = await props.params;
  const searchParams = await props.searchParams;
  const requestedStrike = Number(searchParams.strike);
  const strikePercent = VALID_STRIKES.includes(requestedStrike) ? requestedStrike : 35;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const position = usePosition(positionId).data;

  if (!position || !position.hasVaultForPool) {
    notFound();
  }

  const vaultId = mockQuoteDefaults.vaultId;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const vault = useVault(vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohort = useCohort(vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const quote = useQuote({ vaultId, strikePercent, coveredAmountUsdc: mockQuoteDefaults.coveredAmountUsdc }).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

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
      walletAddress={wallet.address}
    />
  );
}

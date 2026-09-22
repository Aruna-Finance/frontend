import { notFound } from "next/navigation";
import { useVault } from "@/hooks/useVaults";
import { useCohorts } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { mockUnderwriterPosition } from "@/lib/mock/vaults";
import { DepositClient } from "./DepositClient";

export default async function UWDepositPage(props: PageProps<"/underwrite/[vaultId]/deposit">) {
  const { vaultId } = await props.params;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const vault = useVault(vaultId).data;
  if (!vault || !vault.hasVault) {
    notFound();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohorts = useCohorts(vaultId).data ?? [];
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

  const activeCohort = cohorts.find((item) => item.status === "ACTIVE");
  const fundingCohort = cohorts.find((item) => item.status === "FUNDING");

  if (!activeCohort || !fundingCohort) {
    notFound();
  }

  return (
    <DepositClient
      vault={vault}
      activeCohortId={activeCohort.id}
      fundingCohortId={fundingCohort.id}
      fundingStartsAt={fundingCohort.startsAt}
      fundingEndsAt={fundingCohort.endsAt}
      walletAddress={wallet.address}
      position={mockUnderwriterPosition}
    />
  );
}

import { DepositClient } from "./DepositClient";

// Vault/cohort existence now depends on an async indexer fetch, so it can no
// longer be checked synchronously here - DepositClient calls notFound()
// itself once loading resolves and the vault genuinely isn't there.
export default async function UWDepositPage(props: PageProps<"/underwrite/[vaultId]/deposit">) {
  const { vaultId } = await props.params;
  return <DepositClient vaultId={vaultId} />;
}

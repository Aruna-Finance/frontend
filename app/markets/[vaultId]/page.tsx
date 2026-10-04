import { MarketDetailClient } from "./MarketDetailClient";

// Vault existence now depends on an async indexer fetch, so it can no longer
// be checked synchronously here - MarketDetailClient calls notFound() itself
// once loading resolves and the vault genuinely isn't there.
export default async function MarketDetailPage(props: PageProps<"/markets/[vaultId]">) {
  const { vaultId } = await props.params;
  return <MarketDetailClient vaultId={vaultId} />;
}

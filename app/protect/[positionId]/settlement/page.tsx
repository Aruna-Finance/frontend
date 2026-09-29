import { SettlementClient } from "./SettlementClient";

// Which policy (if any) belongs to this position depends on an async
// indexer fetch, so existence can no longer be checked synchronously here —
// SettlementClient calls notFound() itself once loading resolves.
export default async function LPSettlementPage(props: PageProps<"/protect/[positionId]/settlement">) {
  const { positionId } = await props.params;
  return <SettlementClient positionId={positionId} />;
}

import { ActiveClient } from "./ActiveClient";

// Which policy (if any) belongs to this position depends on an async
// indexer fetch, so existence can no longer be checked synchronously here -
// ActiveClient calls notFound() itself once loading resolves.
export default async function LPActivePage(props: PageProps<"/protect/[positionId]/active">) {
  const { positionId } = await props.params;
  return <ActiveClient positionId={positionId} />;
}

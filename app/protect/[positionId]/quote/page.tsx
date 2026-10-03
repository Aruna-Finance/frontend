import { QuoteClient } from "./QuoteClient";

export default async function LPQuotePage(props: PageProps<"/protect/[positionId]/quote">) {
  const { positionId } = await props.params;
  return <QuoteClient positionId={positionId} />;
}

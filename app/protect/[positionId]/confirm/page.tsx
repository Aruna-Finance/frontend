import { ConfirmClient } from "./ConfirmClient";

const VALID_STRIKES = [30, 35, 45, 55];

export default async function LPConfirmPage(props: PageProps<"/protect/[positionId]/confirm">) {
  const { positionId } = await props.params;
  const searchParams = await props.searchParams;
  const requestedStrike = Number(searchParams.strike);
  const strikePercent = VALID_STRIKES.includes(requestedStrike) ? requestedStrike : 35;

  return <ConfirmClient positionId={positionId} strikePercent={strikePercent} />;
}

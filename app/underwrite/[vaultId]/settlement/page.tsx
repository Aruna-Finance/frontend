import { SettlementClient } from "./SettlementClient";

export default async function UWSettlementPage(props: PageProps<"/underwrite/[vaultId]/settlement">) {
  const { vaultId } = await props.params;
  return <SettlementClient vaultId={vaultId} />;
}

import { DashboardClient } from "./DashboardClient";

export default async function UWDashboardPage(props: PageProps<"/underwrite/[vaultId]/dashboard">) {
  const { vaultId } = await props.params;
  return <DashboardClient vaultId={vaultId} />;
}

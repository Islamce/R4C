import { notFound } from "next/navigation";
import { CommercialWorkspaceSuite } from "../../components/CommercialWorkspaceSuite";
import { AppShell } from "../../components/AppShell";
import { QuotationWorkspace } from "../../components/QuotationWorkspace";
import { FlutterSalesCompanionPreview } from "../../components/FlutterSalesCompanionPreview";

export default async function CommercialDesignPreviewPage({ searchParams }: { searchParams: Promise<{ surface?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const surface = query.surface === "flutter" ? <FlutterSalesCompanionPreview /> : query.surface === "quotations" ? <QuotationWorkspace /> : <CommercialWorkspaceSuite preview />;
  return <AppShell preview>{surface}</AppShell>;
}

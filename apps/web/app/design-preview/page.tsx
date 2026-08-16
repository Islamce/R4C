import { notFound } from "next/navigation";
import { CommercialWorkspaceSuite } from "../../components/CommercialWorkspaceSuite";
import { AppShell } from "../../components/AppShell";

export default function CommercialDesignPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <AppShell preview><CommercialWorkspaceSuite preview /></AppShell>;
}

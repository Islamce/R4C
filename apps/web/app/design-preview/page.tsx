import { notFound } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { SalesCommandCenter } from "../../components/SalesCommandCenter";

export default function SalesDesignPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <AppShell preview previewSurface="sales"><SalesCommandCenter preview /></AppShell>;
}

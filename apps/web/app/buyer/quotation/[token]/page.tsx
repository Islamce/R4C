import { BuyerQuotationExperience } from "../../../../components/BuyerQuotationExperience";

export default async function BuyerQuotationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preview?: string; state?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  return <BuyerQuotationExperience token={token} preview={query.preview === "1"} previewState={query.state === "expired" ? "expired" : undefined} />;
}

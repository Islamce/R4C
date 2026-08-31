import { headers } from "next/headers";
import { CustomerPortfolio } from "../../components/CustomerPortfolio";
import { requestHost, tenantCodeForRequest } from "../../lib/tenant-resolution";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ tenant?: string | string[] }> }) {
  const params = await searchParams;
  const override = Array.isArray(params.tenant) ? params.tenant[0] : params.tenant;
  const requestHeaders = await headers();
  const tenantCode = tenantCodeForRequest({ host: requestHost(requestHeaders), override });
  return <CustomerPortfolio tenantCode={tenantCode ?? ""} />;
}

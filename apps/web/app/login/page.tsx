import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/LoginForm";
import { normalizeLocale } from "../../lib/i18n";
import { hasSessionCookies, LOCALE_COOKIE } from "../../lib/server-session";
import {
  requestHost,
  resolveTenantByCode,
  tenantCodeForRequest,
  tenantDisplayName,
} from "../../lib/tenant-resolution";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string | string[] }>;
}) {
  const store = await cookies();
  if (hasSessionCookies(store)) redirect("/projects");

  const params = await searchParams;
  const override = Array.isArray(params.tenant) ? params.tenant[0] : params.tenant;
  const requestHeaders = await headers();
  const tenantCode = tenantCodeForRequest({
    host: requestHost(requestHeaders),
    override,
  });
  const locale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);

  try {
    const tenant = await resolveTenantByCode(tenantCode);
    return (
      <LoginForm
        tenant={{ code: tenant.code, name: tenantDisplayName(tenant, locale) }}
        tenantOverride={override ? tenant.code : undefined}
      />
    );
  } catch {
    return <LoginForm tenant={null} tenantOverride={override} />;
  }
}

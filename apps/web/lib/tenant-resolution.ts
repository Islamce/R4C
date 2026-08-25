import { ApiError, publicApiRequest } from "./server-session";
import type { Locale } from "./i18n";

const TENANT_CODE = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
type HeaderReader = { get(name: string): string | null };

export interface TenantLookupRecord {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE";
}

function hostnameOnly(host: string | null | undefined) {
  if (!host) return "";
  const value = host.trim().toLowerCase();
  if (value.startsWith("[")) {
    const closing = value.indexOf("]");
    return closing >= 0 ? value.slice(1, closing) : value;
  }
  return value.split(":", 1)[0] ?? "";
}

export function requestHost(headers: HeaderReader) {
  return headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim() ?? headers.get("host");
}

export function requestClientIp(headers: HeaderReader) {
  return (
    headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    headers.get("x-real-ip")?.trim() ??
    null
  );
}

export function normalizeTenantCode(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() ?? "";
  return TENANT_CODE.test(code) ? code : null;
}

export function tenantCodeForRequest({
  host,
  override,
}: {
  host: string | null | undefined;
  override?: string | null;
}) {
  const hostname = hostnameOnly(host);
  const local = LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
  const overrideCode = normalizeTenantCode(override);
  if (overrideCode && (local || process.env.NODE_ENV !== "production")) return overrideCode;

  const configuredBaseDomain = process.env.TENANT_BASE_DOMAIN;
  if (!configuredBaseDomain && process.env.NODE_ENV === "production") {
    throw new Error("TENANT_BASE_DOMAIN is required in production");
  }
  const baseDomain = (configuredBaseDomain ?? "r4c.local")
    .trim()
    .toLowerCase()
    .replace(/^\.+|\.+$/g, "");
  if (baseDomain && hostname === baseDomain) {
    return normalizeTenantCode(process.env.TENANT_DEFAULT_CODE);
  }
  if (baseDomain && hostname.endsWith(`.${baseDomain}`)) {
    const prefix = hostname.slice(0, -(baseDomain.length + 1));
    const tenantLabel = prefix.split(".").filter(Boolean).at(-1);
    const subdomainCode = normalizeTenantCode(tenantLabel);
    if (subdomainCode) return subdomainCode;
  }

  if (local) return normalizeTenantCode(process.env.TENANT_DEFAULT_CODE);
  return null;
}

export async function resolveTenantByCode(
  code: string | null,
  clientIp?: string | null,
) {
  if (!code) throw new ApiError(404, "Tenant could not be resolved");
  return publicApiRequest<TenantLookupRecord>(
    `/tenants/by-code/${encodeURIComponent(code)}`,
    clientIp ? { headers: { "x-forwarded-for": clientIp } } : {},
  );
}

export function tenantDisplayName(tenant: TenantLookupRecord, locale: Locale) {
  const uatCode = normalizeTenantCode(process.env.SEED_UAT_TENANT_CODE ?? "ALOMRAN");
  if (locale === "ar" && tenant.code === uatCode) {
    return process.env.SEED_UAT_TENANT_NAME_AR?.trim() || "العمران للتطوير العقاري";
  }
  return tenant.name;
}

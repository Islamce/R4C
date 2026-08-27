import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type {
  AuthSessionResponse,
  BrowserSessionUser,
  SessionTenant,
  SessionUser,
} from "./types";

const ACCESS_COOKIE = "r4c_access_token";
const REFRESH_COOKIE = "r4c_refresh_token";
const TENANT_COOKIE = "r4c_tenant_code";
const LEGACY_TENANT_COOKIE = "r4c_tenant_id";
const USER_COOKIE = "r4c_session_user";
export const LOCALE_COOKIE = "r4c_locale";

function apiBaseUrl() {
  const configured = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("API_URL is required in production");
  }
  return "http://localhost:4000/api/v1";
}

const refreshFlights = new Map<
  string,
  { promise: Promise<AuthSessionResponse>; expiresAt: number }
>();
const REFRESH_GRACE_MS = 5_000;

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type TenantResolution = { id: string; code: string; name: string; status: "ACTIVE" };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      ...(this.details === undefined ? {} : { details: this.details }),
    };
  }
}

function secureCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function encodeUser(user: BrowserSessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

function decodeUser(value: string | undefined): BrowserSessionUser | null {
  if (!value) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<BrowserSessionUser>;
    if (
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.displayName !== "string" ||
      typeof decoded.role !== "string" ||
      !Array.isArray(decoded.permissions)
    ) {
      return null;
    }
    return {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName,
      role: decoded.role,
      permissions: decoded.permissions,
      tenant:
        decoded.tenant &&
        typeof decoded.tenant.code === "string" &&
        typeof decoded.tenant.name === "string"
          ? decoded.tenant
          : { code: "", name: "" },
    };
  } catch {
    return null;
  }
}

export function browserSessionUser(
  user: SessionUser,
  tenant: SessionTenant,
): BrowserSessionUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    permissions: user.permissions,
    tenant,
  };
}

function normalizeMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join("; ");
  }
  return fallback;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function publicApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
  });
  const body = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(
      response.status,
      normalizeMessage(body, `API request failed with ${response.status}`),
      body,
    );
  }
  return body as T;
}

async function tenantIdForCode(code: string) {
  const tenant = await publicApiRequest<TenantResolution>(
    `/tenants/by-code/${encodeURIComponent(code)}`,
  );
  return tenant.id;
}

export async function persistSession(
  session: AuthSessionResponse,
  providedStore?: CookieStore,
  tenant?: SessionTenant,
) {
  const store = providedStore ?? (await cookies());
  const existingTenant = decodeUser(store.get(USER_COOKIE)?.value)?.tenant;
  const sessionTenant = tenant ?? existingTenant ?? { code: "", name: "" };
  if (!sessionTenant.code) throw new ApiError(500, "Session tenant code is unavailable");

  store.set(ACCESS_COOKIE, session.accessToken, secureCookie(session.expiresInSeconds));
  store.set(
    REFRESH_COOKIE,
    session.refreshToken,
    secureCookie(session.refreshTokenExpiresInSeconds),
  );
  store.set(
    TENANT_COOKIE,
    sessionTenant.code,
    secureCookie(session.refreshTokenExpiresInSeconds),
  );
  store.set(LEGACY_TENANT_COOKIE, "", secureCookie(0));
  store.set(
    USER_COOKIE,
    encodeUser(browserSessionUser(session.user, sessionTenant)),
    secureCookie(session.refreshTokenExpiresInSeconds),
  );
}

export async function clearSession(providedStore?: CookieStore) {
  const store = providedStore ?? (await cookies());
  for (const name of [
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    TENANT_COOKIE,
    LEGACY_TENANT_COOKIE,
    USER_COOKIE,
  ]) {
    store.set(name, "", secureCookie(0));
  }
}

export function hasSessionCookies(store: CookieStore): boolean {
  return Boolean(store.get(REFRESH_COOKIE)?.value || store.get(ACCESS_COOKIE)?.value);
}

export function sessionUser(store: CookieStore): BrowserSessionUser | null {
  return decodeUser(store.get(USER_COOKIE)?.value);
}

function refreshKey(refreshToken: string, tenantId: string) {
  return `${tenantId}:${refreshToken}`;
}

async function rotateRefreshToken(
  refreshToken: string,
  tenantId: string,
): Promise<AuthSessionResponse> {
  const key = refreshKey(refreshToken, tenantId);
  const existing = refreshFlights.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.promise;

  const promise = publicApiRequest<AuthSessionResponse>("/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken, tenantId }),
  });
  refreshFlights.set(key, {
    promise,
    expiresAt: Date.now() + REFRESH_GRACE_MS,
  });

  promise
    .then(() => {
      setTimeout(() => refreshFlights.delete(key), REFRESH_GRACE_MS);
    })
    .catch(() => refreshFlights.delete(key));

  return promise;
}

export async function refreshSession(
  providedStore?: CookieStore,
): Promise<AuthSessionResponse> {
  const store = providedStore ?? (await cookies());
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const tenantCode = store.get(TENANT_COOKIE)?.value;
  const tenant = decodeUser(store.get(USER_COOKIE)?.value)?.tenant;
  if (!refreshToken || !tenantCode || !tenant) {
    await clearSession(store);
    throw new ApiError(401, "Session refresh is unavailable");
  }

  try {
    const tenantId = await tenantIdForCode(tenantCode);
    const rotated = await rotateRefreshToken(refreshToken, tenantId);
    await persistSession(rotated, store, tenant);
    return rotated;
  } catch (error) {
    await clearSession(store);
    throw error;
  }
}

function bearerHeaders(init: RequestInit, accessToken: string) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${accessToken}`);
  return headers;
}

export async function authenticatedApiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; refreshCount: 0 | 1 }> {
  const store = await cookies();
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  let refreshCount: 0 | 1 = 0;

  if (!accessToken) {
    const session = await refreshSession(store);
    accessToken = session.accessToken;
    refreshCount = 1;
  }

  const send = () =>
    publicApiRequest<T>(path, {
      ...init,
      headers: bearerHeaders(init, accessToken as string),
    });

  try {
    return { data: await send(), refreshCount };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || refreshCount === 1) {
      throw error;
    }
    const session = await refreshSession(store);
    accessToken = session.accessToken;
    refreshCount = 1;
    try {
      return { data: await send(), refreshCount };
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        await clearSession(store);
      }
      throw retryError;
    }
  }
}

export async function resolveSessionTenantId(store: CookieStore) {
  const tenantCode = store.get(TENANT_COOKIE)?.value;
  if (!tenantCode) throw new ApiError(401, "Session tenant is unavailable");
  return tenantIdForCode(tenantCode);
}

export function apiErrorResponse(error: unknown) {
  const normalized =
    error instanceof ApiError
      ? error
      : new ApiError(500, "Unexpected server error");
  return NextResponse.json(
    { error: normalized.toJSON() },
    { status: normalized.status },
  );
}

export function refreshHeader(refreshCount: number) {
  return { "x-r4c-session-refresh-count": String(refreshCount) };
}

export const sessionCookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
  tenant: TENANT_COOKIE,
  user: USER_COOKIE,
} as const;

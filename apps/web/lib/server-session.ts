import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthSessionResponse, SessionUser } from "./types";

const ACCESS_COOKIE = "r4c_access_token";
const REFRESH_COOKIE = "r4c_refresh_token";
const TENANT_COOKIE = "r4c_tenant_id";
const USER_COOKIE = "r4c_session_user";
export const LOCALE_COOKIE = "r4c_locale";

const API_BASE_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1"
).replace(/\/$/, "");

const refreshFlights = new Map<
  string,
  { promise: Promise<AuthSessionResponse>; expiresAt: number }
>();
const REFRESH_GRACE_MS = 5_000;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

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

function encodeUser(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

function decodeUser(value: string | undefined): SessionUser | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

export async function persistSession(
  session: AuthSessionResponse,
  store: CookieStore = await cookies(),
) {
  store.set(ACCESS_COOKIE, session.accessToken, secureCookie(session.expiresInSeconds));
  store.set(
    REFRESH_COOKIE,
    session.refreshToken,
    secureCookie(session.refreshTokenExpiresInSeconds),
  );
  store.set(
    TENANT_COOKIE,
    session.user.tenantId,
    secureCookie(session.refreshTokenExpiresInSeconds),
  );
  store.set(
    USER_COOKIE,
    encodeUser(session.user),
    secureCookie(session.refreshTokenExpiresInSeconds),
  );
}

export async function clearSession(store: CookieStore = await cookies()) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, TENANT_COOKIE, USER_COOKIE]) {
    store.set(name, "", secureCookie(0));
  }
}

export function hasSessionCookies(store: CookieStore): boolean {
  return Boolean(store.get(REFRESH_COOKIE)?.value || store.get(ACCESS_COOKIE)?.value);
}

export function sessionUser(store: CookieStore): SessionUser | null {
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
      const timer = setTimeout(() => refreshFlights.delete(key), REFRESH_GRACE_MS);
      timer.unref?.();
    })
    .catch(() => refreshFlights.delete(key));

  return promise;
}

export async function refreshSession(
  store: CookieStore = await cookies(),
): Promise<AuthSessionResponse> {
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const tenantId = store.get(TENANT_COOKIE)?.value;
  if (!refreshToken || !tenantId) {
    await clearSession(store);
    throw new ApiError(401, "Session refresh is unavailable");
  }

  try {
    const rotated = await rotateRefreshToken(refreshToken, tenantId);
    await persistSession(rotated, store);
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

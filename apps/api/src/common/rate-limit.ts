import { ExecutionContext } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

export const RATE_LIMIT_WINDOW_MS = 60_000;

export function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer but received: ${value}`);
  }
  return parsed;
}

export function trustProxyHops(value = process.env.TRUST_PROXY_HOPS): number {
  if (value === undefined || value.trim() === "") return 1;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer");
  }
  return parsed;
}

function environmentLimit(name: string, fallback: number) {
  return (_context: ExecutionContext) => positiveInteger(process.env[name], fallback);
}

export const LoginRateLimit = () =>
  Throttle({
    default: {
      limit: environmentLimit("RATE_LIMIT_LOGIN_PER_MINUTE", 5),
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  });

export const AuthSessionRateLimit = () =>
  Throttle({
    default: {
      limit: environmentLimit("RATE_LIMIT_AUTH_SESSION_PER_MINUTE", 20),
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  });

export const PasswordResetRateLimit = () =>
  Throttle({
    default: {
      limit: environmentLimit("RATE_LIMIT_PASSWORD_RESET_PER_MINUTE", 3),
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  });

export const TenantLookupRateLimit = () =>
  Throttle({
    default: {
      limit: environmentLimit("RATE_LIMIT_TENANT_LOOKUP_PER_MINUTE", 20),
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  });

export const UploadRateLimit = () =>
  Throttle({
    default: {
      limit: environmentLimit("RATE_LIMIT_UPLOAD_PER_MINUTE", 10),
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  });

export const SearchExportRateLimit = () =>
  Throttle({
    default: {
      limit: environmentLimit("RATE_LIMIT_SEARCH_EXPORT_PER_MINUTE", 30),
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  });

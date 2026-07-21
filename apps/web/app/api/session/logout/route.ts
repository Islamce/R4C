import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  clearSession,
  publicApiRequest,
  sessionCookieNames,
} from "../../../../lib/server-session";

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(sessionCookieNames.refresh)?.value;
  const tenantId = store.get(sessionCookieNames.tenant)?.value;

  try {
    if (refreshToken && tenantId) {
      await publicApiRequest("/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken, tenantId }),
      });
    }
    await clearSession(store);
    return NextResponse.json({ revoked: true });
  } catch (error) {
    await clearSession(store);
    return apiErrorResponse(error);
  }
}

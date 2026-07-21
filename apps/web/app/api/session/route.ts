import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ApiError,
  apiErrorResponse,
  refreshHeader,
  refreshSession,
  sessionCookieNames,
  sessionUser,
} from "../../../lib/server-session";

export async function GET() {
  try {
    const store = await cookies();
    let user = sessionUser(store);
    let refreshCount: 0 | 1 = 0;

    if (!store.get(sessionCookieNames.access)?.value) {
      await refreshSession(store);
      user = sessionUser(store);
      refreshCount = 1;
    }

    if (!user) throw new ApiError(401, "Session is unavailable");
    return NextResponse.json(
      { user },
      { headers: refreshHeader(refreshCount) },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

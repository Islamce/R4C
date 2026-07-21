import { NextResponse } from "next/server";
import type { AuthSessionResponse } from "../../../../lib/types";
import {
  apiErrorResponse,
  persistSession,
  publicApiRequest,
} from "../../../../lib/server-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await publicApiRequest<AuthSessionResponse>("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await persistSession(session);
    return NextResponse.json({ user: session.user }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

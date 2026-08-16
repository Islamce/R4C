import { NextResponse } from "next/server";
import { apiErrorResponse, publicApiRequest } from "../../../../lib/server-session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await publicApiRequest("/auth/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json({ reset: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

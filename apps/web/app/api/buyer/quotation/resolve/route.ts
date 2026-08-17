import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse, publicApiRequest } from "../../../../../lib/server-session";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (!body) throw new ApiError(400, "A quotation token is required");
    const data = await publicApiRequest<unknown>("/buyer/quotation/resolve", {
      method: "POST",
      body,
      headers: { "content-type": request.headers.get("content-type") ?? "application/json" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

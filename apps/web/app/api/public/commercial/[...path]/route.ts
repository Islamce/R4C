import { NextResponse } from "next/server";
import { ApiError, publicApiRequest } from "../../../../../lib/server-session";

const allowed = new Set(["portfolio", "phone/request", "phone/verify", "interests"]);

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const key = path.join("/");
    if (!allowed.has(key) || (request.method === "GET") !== (key === "portfolio")) throw new ApiError(404, "Route unavailable");
    const source = new URL(request.url);
    const body = request.method === "GET" ? undefined : await request.text();
    const result = await publicApiRequest<unknown>(`/public/commercial/${key}${source.search}`, { method: request.method, ...(body ? { body, headers: { "content-type": "application/json" } } : {}) });
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ message }, { status });
  }
}

export const GET = forward;
export const POST = forward;

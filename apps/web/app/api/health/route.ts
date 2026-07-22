import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    service: "r4c-web",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

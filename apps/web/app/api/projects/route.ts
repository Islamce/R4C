import { NextResponse } from "next/server";
import type { ProjectRecord } from "../../../lib/types";
import {
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../lib/server-session";

export async function GET() {
  try {
    const result = await authenticatedApiRequest<ProjectRecord[]>("/projects");
    return NextResponse.json(result.data, {
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await authenticatedApiRequest<ProjectRecord>("/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(result.data, {
      status: 201,
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import type {
  SubmitProgressPayload,
  WbsProgressUpdateRecord,
} from "../../../../../lib/types";
import {
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../../lib/server-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ wbsNodeId: string }> },
) {
  try {
    const { wbsNodeId } = await context.params;
    const result = await authenticatedApiRequest<WbsProgressUpdateRecord[]>(
      `/wbs/${encodeURIComponent(wbsNodeId)}/progress`,
    );
    return NextResponse.json(result.data, {
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ wbsNodeId: string }> },
) {
  try {
    const { wbsNodeId } = await context.params;
    const body = (await request.json()) as SubmitProgressPayload;
    const result = await authenticatedApiRequest<WbsProgressUpdateRecord>(
      `/wbs/${encodeURIComponent(wbsNodeId)}/progress`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(result.data, {
      status: 201,
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

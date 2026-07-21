import { NextResponse } from "next/server";
import type {
  ReviewProgressPayload,
  WbsProgressUpdateRecord,
} from "../../../../../lib/types";
import {
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../../lib/server-session";

export async function POST(
  request: Request,
  context: { params: Promise<{ progressUpdateId: string }> },
) {
  try {
    const { progressUpdateId } = await context.params;
    const body = (await request.json()) as ReviewProgressPayload;
    const result = await authenticatedApiRequest<WbsProgressUpdateRecord>(
      `/progress/${encodeURIComponent(progressUpdateId)}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(result.data, {
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

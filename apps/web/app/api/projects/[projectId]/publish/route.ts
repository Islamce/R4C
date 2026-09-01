import { NextResponse } from "next/server";
import type { ProjectRecord } from "../../../../../lib/types";
import {
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../../lib/server-session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const result = await authenticatedApiRequest<ProjectRecord>(
      `/projects/${encodeURIComponent(projectId)}/publish`,
      { method: "POST" },
    );
    return NextResponse.json(result.data, {
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

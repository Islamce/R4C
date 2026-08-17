import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../../../../lib/server-session";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const body = await request.text();
    const result = await authenticatedApiRequest<unknown>(
      `/projects/${encodeURIComponent(projectId)}/wbs/import/preview`,
      {
        method: "POST",
        body,
        headers: { "content-type": request.headers.get("content-type") ?? "application/json" },
      },
    );
    return NextResponse.json(result.data, { headers: refreshHeader(result.refreshCount) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

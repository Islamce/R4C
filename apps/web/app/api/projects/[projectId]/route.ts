import { NextResponse } from "next/server";
import type {
  ProjectDetailPayload,
  ProjectRecord,
  WbsNodeRecord,
} from "../../../../lib/types";
import {
  ApiError,
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../lib/server-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const projects = await authenticatedApiRequest<ProjectRecord[]>("/projects");
    const project = projects.data.find((candidate) => candidate.id === projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const wbs = await authenticatedApiRequest<WbsNodeRecord[]>(
      `/projects/${encodeURIComponent(projectId)}/wbs`,
    );
    const payload: ProjectDetailPayload = { project, wbs: wbs.data };
    return NextResponse.json(payload, {
      headers: refreshHeader(Math.min(1, projects.refreshCount + wbs.refreshCount)),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

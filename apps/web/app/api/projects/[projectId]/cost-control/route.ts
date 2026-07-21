import { NextResponse } from "next/server";
import type {
  CostControlNode,
  CostControlResponse,
} from "../../../../../lib/types";
import {
  ApiError,
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../../lib/server-session";

type BackendCostControlResponse = Omit<CostControlResponse, "nodes"> & {
  nodes?: CostControlNode[];
  wbs?: CostControlNode[];
};

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const asOf = new URL(request.url).searchParams.get("asOf");
    if (asOf && !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
      throw new ApiError(400, "Invalid as-of date");
    }

    // The current API controller names this query parameter `date`. The web
    // boundary exposes the product language `asOf` and translates it here.
    const query = asOf ? `?date=${encodeURIComponent(asOf)}` : "";
    const result = await authenticatedApiRequest<BackendCostControlResponse>(
      `/projects/${encodeURIComponent(projectId)}/cost-control${query}`,
    );
    const payload: CostControlResponse = {
      budget: result.data.budget,
      asOf: result.data.asOf,
      summary: result.data.summary,
      // Current main returns `wbs`; accept `nodes` as well so this boundary
      // remains compatible when the documented response name is adopted.
      nodes: result.data.nodes ?? result.data.wbs ?? [],
    };

    return NextResponse.json(payload, {
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import {
  ApiError,
  apiErrorResponse,
  authenticatedApiRequest,
  refreshHeader,
} from "../../../../lib/server-session";

const readPaths = [
  /^commercial\/(?:phases|buildings|floors|unit-types|units)(?:\/[^/]+)?$/,
  /^commercial\/units\/[^/]+\/prices$/,
  /^commercial\/projects\/[^/]+\/payment-plans$/,
  /^commercial\/leads(?:\/all)?(?:\/[^/]+)?$/,
  /^commercial\/leads\/[^/]+\/activities$/,
  /^commercial\/assignees$/,
  /^bim-models\/[^/]+\/(?:viewer-manifest|visual-state|4d-state|5d-state|material-state|quality-state|safety-state|turnover-state)$/,
  /^bim-models\/[^/]+\/elements\/global\/[^/]+$/,
  /^projects\/[^/]+\/wbs$/,
];

const writePaths = [
  /^commercial\/(?:phases|buildings|floors|unit-types|units)(?:\/[^/]+)?(?:\/(?:release|block))?$/,
  /^commercial\/(?:customers|leads|holds)$/,
  /^commercial\/leads\/[^/]+\/(?:status|disqualify|assignee|activities)$/,
  /^commercial\/holds\/[^/]+\/(?:cancel|confirm)$/,
  /^bim-models\/[^/]+\/wbs-links$/,
  /^wbs\/[^/]+\/progress$/,
];

function permitted(path: string, method: string) {
  const patterns = method === "GET" ? readPaths : ["POST", "PATCH"].includes(method) ? writePaths : [];
  return patterns.some((pattern) => pattern.test(path));
}

async function forward(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await context.params;
    const path = segments.join("/");
    if (!permitted(path, request.method)) {
      throw new ApiError(404, "Server API route is unavailable");
    }

    const target = new URL(request.url);
    const body = request.method === "GET" ? undefined : await request.text();
    const result = await authenticatedApiRequest<unknown>(
      `/${segments.map(encodeURIComponent).join("/")}${target.search}`,
      {
        method: request.method,
        ...(body === undefined
          ? {}
          : {
              body,
              headers: { "content-type": request.headers.get("content-type") ?? "application/json" },
            }),
      },
    );

    return NextResponse.json(result.data, {
      headers: refreshHeader(result.refreshCount),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;

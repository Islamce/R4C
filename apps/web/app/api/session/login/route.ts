import { NextResponse } from "next/server";
import type { AuthSessionResponse } from "../../../../lib/types";
import {
  apiErrorResponse,
  browserSessionUser,
  persistSession,
  publicApiRequest,
} from "../../../../lib/server-session";
import {
  requestHost,
  resolveTenantByCode,
  tenantCodeForRequest,
} from "../../../../lib/tenant-resolution";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const override = new URL(request.url).searchParams.get("tenant");
    const tenantCode = tenantCodeForRequest({
      host: requestHost(request.headers),
      override,
    });
    const tenant = await resolveTenantByCode(tenantCode);
    const session = await publicApiRequest<AuthSessionResponse>("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, tenantId: tenant.id }),
    });
    const tenantView = { code: tenant.code, name: tenant.name };
    await persistSession(session, undefined, tenantView);
    return NextResponse.json(
      { user: browserSessionUser(session.user, tenantView) },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

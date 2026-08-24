import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "../../../lib/server-session";

const supportedLocales = new Set(["en", "ar"]);

export async function POST(request: Request) {
  let payload: { locale?: unknown } = {};
  try {
    payload = (await request.json()) as { locale?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid locale request" }, { status: 400 });
  }

  if (typeof payload.locale !== "string" || !supportedLocales.has(payload.locale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, payload.locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ locale: payload.locale });
}

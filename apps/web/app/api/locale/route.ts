import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { normalizeLocale } from "../../../lib/i18n";
import { LOCALE_COOKIE } from "../../../lib/server-session";

export async function POST(request: Request) {
  const body = (await request.json()) as { locale?: string };
  const locale = normalizeLocale(body.locale);
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return NextResponse.json({ locale });
}

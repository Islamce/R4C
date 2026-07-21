import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { hasSessionCookies } from "../../lib/server-session";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await cookies();
  if (!hasSessionCookies(store)) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

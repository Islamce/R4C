import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { hasSessionCookies, sessionUser } from "../../lib/server-session";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await cookies();
  if (!hasSessionCookies(store)) redirect("/login");
  const user = sessionUser(store);
  if (!user) redirect("/login");
  return <AppShell initialUser={user}>{children}</AppShell>;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "../../components/LoginForm";
import { hasSessionCookies } from "../../lib/server-session";

export default async function LoginPage() {
  const store = await cookies();
  if (hasSessionCookies(store)) redirect("/projects");
  return <LoginForm />;
}

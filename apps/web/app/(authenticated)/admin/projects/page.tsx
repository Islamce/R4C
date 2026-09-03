import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsJourney } from "../../../../components/ProjectsJourney";
import { sessionUser } from "../../../../lib/server-session";

export default async function ProjectAdministrationPage() {
  const user = sessionUser(await cookies());
  if (!user?.permissions.includes("project:create")) {
    redirect("/commercial?view=portfolio");
  }
  return <ProjectsJourney canPublish />;
}

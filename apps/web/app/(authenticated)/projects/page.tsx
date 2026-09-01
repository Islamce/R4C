import { cookies } from "next/headers";
import { ProjectsJourney } from "../../../components/ProjectsJourney";
import { sessionUser } from "../../../lib/server-session";

export default async function ProjectsPage() {
  const user = sessionUser(await cookies());
  return <ProjectsJourney canPublish={user?.permissions.includes("project:create") ?? false} />;
}

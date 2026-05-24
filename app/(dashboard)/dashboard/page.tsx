import DashboardPage from "./DashboardPage";
import { preloadAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

export default async function  Dashboard() {
  const preloadedAuthQuery = await preloadAuthQuery(api.auth.getCurrentUser)  
  return (
    <DashboardPage preloadedAuthQuery={preloadedAuthQuery} />
  );
}

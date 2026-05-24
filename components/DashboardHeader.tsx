import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import UserMenu from "./UserMenu";
import HeaderSearch from "./HeaderSearch";

export default async function DashboardHeader() {
    const user = await fetchAuthQuery(api.auth.getCurrentUser);
    const firstName = user?.name?.split(" ")[0] ?? "there";
    const initial = (firstName[0] ?? "U").toUpperCase();
    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center gap-3 px-4 py-3 bg-[var(--background)] border-b border-x border-[var(--card-border)] z-50">
            <UserMenu initial={initial} />
            <span className="text-lg font-semibold truncate">Hi {firstName}</span>
            <div className="ml-auto flex items-center gap-3">
                <HeaderSearch />
            </div>
        </header>
    );
}

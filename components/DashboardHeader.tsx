import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import UserMenu from "./UserMenu";
import HeaderSearch from "./HeaderSearch";
import Sigil from "./Sigil";

export default async function DashboardHeader() {
    // Prefer the profile's displayName (user-editable) over the auth user's
    // name (set once at signup, never changes).
    const [profile, authUser] = await Promise.all([
        fetchAuthQuery(api.user.getProfile, {}),
        fetchAuthQuery(api.auth.getCurrentUser),
    ]);
    const name = profile?.displayName ?? authUser?.name ?? "friend";
    const firstName = name.split(" ")[0] || "friend";
    const initial = (firstName[0] ?? "U").toUpperCase();
    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center gap-3 px-4 py-3 bg-[var(--paper)]/85 backdrop-blur-md border-b border-x border-[var(--card-border)] z-50">
            <UserMenu initial={initial} />
            <div className="flex flex-col leading-none min-w-0">
                <span className="eyebrow text-[var(--ink-faint)]">Namaste</span>
                <span
                    className="font-display text-xl text-[var(--ink)] truncate"
                    style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
                >
                    {firstName}
                </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <HeaderSearch />
                <Sigil
                    size={28}
                    accent="var(--saffron)"
                    className="text-[var(--saffron)] opacity-70 shrink-0"
                    spin
                />
            </div>
        </header>
    );
}

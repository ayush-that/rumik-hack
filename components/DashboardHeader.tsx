import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Search, MessageCircle, Plus } from "lucide-react";
import UserMenu from "./UserMenu";

export default async function DashboardHeader() {
    const user = await fetchAuthQuery(api.auth.getCurrentUser);
    const firstName = user?.name?.split(" ")[0] ?? "there";
    const initial = (firstName[0] ?? "U").toUpperCase();
    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center gap-3 px-4 py-3 bg-[var(--background)] border-b border-x border-[var(--card-border)] z-50">
            <UserMenu initial={initial} />
            <span className="text-lg font-semibold">Hi {firstName}</span>
            <div className="ml-auto flex items-center gap-3">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 text-sm font-medium">
                    <span>Add Cash</span>
                    <Plus size={16} className="rounded-full bg-black text-white p-0.5" />
                </button>
                <Search size={22} className="text-zinc-700" />
                <MessageCircle size={22} className="text-zinc-700" />
            </div>
        </header>
    );
}

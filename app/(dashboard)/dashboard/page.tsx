import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import CategoryChips from "@/components/CategoryChips";
import FilterChips from "@/components/FilterChips";
import CounsellorCard from "@/components/CounsellorCard";

type SP = { category?: string; mode?: "celebrity" | "new" | "all" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
    const sp = await searchParams;
    const counsellors = await fetchAuthQuery(api.counsellors.list, {
        category: sp.category,
        mode: sp.mode === "celebrity" || sp.mode === "new" ? sp.mode : undefined,
    });
    return (
        <>
            <div className="fixed top-14 inset-x-0 mx-auto max-w-[480px] bg-[var(--background)] border-x border-b border-[var(--card-border)] z-40">
                <CategoryChips />
                <FilterChips />
            </div>
            <div className="pt-[112px]">
                {counsellors.length === 0 ? (
                    <p className="text-center text-zinc-500 mt-8">No counsellors match these filters.</p>
                ) : (
                    counsellors.map((c, i) => <CounsellorCard key={c._id} c={c} priority={i === 0} />)
                )}
            </div>
        </>
    );
}

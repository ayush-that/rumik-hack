import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import DashboardHeader from "@/components/DashboardHeader";
import RechargeBanner from "@/components/RechargeBanner";
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
            <DashboardHeader />
            <RechargeBanner />
            <CategoryChips />
            <FilterChips />
            <div>
                {counsellors.length === 0 ? (
                    <p className="text-center text-zinc-500 mt-8">No counsellors match these filters.</p>
                ) : (
                    counsellors.map((c) => <CounsellorCard key={c._id} c={c} />)
                )}
            </div>
        </>
    );
}

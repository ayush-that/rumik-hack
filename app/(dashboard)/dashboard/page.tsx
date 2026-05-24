import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import CategoryChips from "@/components/CategoryChips";
import FilterChips from "@/components/FilterChips";
import CounsellorCard from "@/components/CounsellorCard";

type SP = { category?: string; mode?: "celebrity" | "new" | "all"; q?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
    const sp = await searchParams;
    const counsellors = await fetchAuthQuery(api.counsellors.list, {
        category: sp.category,
        mode: sp.mode === "celebrity" || sp.mode === "new" ? sp.mode : undefined,
        q: sp.q,
    });
    return (
        <>
            <div className="fixed top-14 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--background)] border-x border-b border-[var(--card-border)] z-40">
                <CategoryChips />
                <FilterChips />
            </div>
            <div className="pt-[112px]">
                {counsellors.length === 0 ? (
                    <div className="text-center mt-12 px-8">
                        <p className="eyebrow">No matches</p>
                        <p
                            className="mt-2 font-display text-xl text-[var(--ink-soft)]"
                            style={{ fontStyle: "italic", fontVariationSettings: '"opsz" 36' }}
                        >
                            The almanac is silent.
                        </p>
                        <p className="mt-1 text-sm text-[var(--ink-faint)]">
                            Try a different category or clear your filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="px-4 mt-2 flex items-baseline justify-between text-[var(--ink-faint)]">
                            <span className="eyebrow">The Council</span>
                            <span className="font-mono text-[10px] tracking-widest nums">
                                {String(counsellors.length).padStart(2, "0")} verified
                            </span>
                        </div>
                        {counsellors.map((c, i) => (
                            <CounsellorCard key={c._id} c={c} priority={i === 0} index={i} />
                        ))}
                    </>
                )}
            </div>
        </>
    );
}

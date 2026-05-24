"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, type CategorySlug } from "@/lib/constants";

export default function CategoryChips() {
    const params = useSearchParams();
    const active = (params.get("category") ?? "") as CategorySlug | "";
    return (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            {CATEGORIES.map(({ slug, label, icon: Icon }) => {
                const isActive = active === slug;
                const next = new URLSearchParams(params.toString());
                if (isActive) next.delete("category"); else next.set("category", slug);
                return (
                    <Link
                        key={slug}
                        href={`?${next.toString()}`}
                        scroll={false}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border ${isActive ? "border-[var(--chip-active)] text-[var(--chip-active)] bg-white" : "border-zinc-200 bg-white text-zinc-700"}`}
                    >
                        <Icon size={16} className={isActive ? "text-[var(--chip-active)]" : "text-zinc-500"} />
                        <span className="text-sm font-medium">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

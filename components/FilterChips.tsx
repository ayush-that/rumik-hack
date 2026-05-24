"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FILTER_MODES } from "@/lib/constants";
import { Crown, Sparkle, SlidersHorizontal } from "lucide-react";

const ICONS = { all: SlidersHorizontal, celebrity: Crown, new: Sparkle } as const;

export default function FilterChips() {
    const params = useSearchParams();
    const active = params.get("mode") ?? "all";
    return (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            {FILTER_MODES.map(({ slug, label }) => {
                const isActive = active === slug;
                const next = new URLSearchParams(params.toString());
                if (slug === "all") next.delete("mode"); else next.set("mode", slug);
                const Icon = ICONS[slug];
                return (
                    <Link
                        key={slug}
                        href={`?${next.toString()}`}
                        scroll={false}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border ${isActive ? "border-amber-400 bg-amber-50 text-zinc-900" : "border-zinc-200 bg-white text-zinc-700"}`}
                    >
                        <Icon size={16} />
                        <span className="text-sm font-medium">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

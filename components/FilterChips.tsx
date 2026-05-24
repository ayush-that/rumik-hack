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
                if (slug === "all") next.delete("mode");
                else next.set("mode", slug);
                const Icon = ICONS[slug];
                return (
                    <Link
                        key={slug}
                        href={`?${next.toString()}`}
                        scroll={false}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                            isActive
                                ? "border-[var(--peacock)] bg-[var(--peacock-wash)] text-[var(--peacock)]"
                                : "border-[var(--card-border-strong)] bg-[var(--vellum)] text-[var(--ink-soft)]"
                        }`}
                    >
                        <Icon size={13} strokeWidth={isActive ? 2 : 1.6} />
                        <span className="text-xs font-medium tracking-wide">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

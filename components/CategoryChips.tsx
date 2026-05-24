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
                if (isActive) next.delete("category");
                else next.set("category", slug);
                return (
                    <Link
                        key={slug}
                        href={`?${next.toString()}`}
                        scroll={false}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                            isActive
                                ? "border-[var(--saffron)] bg-[var(--saffron-wash)] text-[var(--saffron-ink)]"
                                : "border-[var(--card-border-strong)] bg-[var(--vellum)] text-[var(--ink-soft)] hover:border-[var(--saffron-soft)]"
                        }`}
                    >
                        <Icon
                            size={14}
                            strokeWidth={isActive ? 2 : 1.6}
                            className={isActive ? "text-[var(--saffron)]" : "text-[var(--ink-faint)]"}
                        />
                        <span className="text-xs font-medium tracking-wide">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

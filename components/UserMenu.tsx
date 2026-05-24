import Link from "next/link";

export default function UserMenu({ initial }: { initial: string }) {
    return (
        <Link
            href="/dashboard/profile"
            aria-label="Profile"
            className="h-10 w-10 rounded-full bg-[var(--vellum)] border border-[var(--card-border-strong)] text-[var(--ink)] font-display text-base flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 80' }}
        >
            {initial}
        </Link>
    );
}

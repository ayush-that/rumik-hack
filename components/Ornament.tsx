// Editorial divider — hairline with a small rotated diamond at center.
// Optional label sits inside the rule (small caps).

export default function Ornament({ label }: { label?: string }) {
    if (label) {
        return (
            <div className="flex items-center gap-3 my-4">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--card-border-strong)] to-[var(--card-border-strong)]" />
                <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--saffron)]" />
                <span className="eyebrow whitespace-nowrap">{label}</span>
                <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--saffron)]" />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--card-border-strong)] to-[var(--card-border-strong)]" />
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 my-4 text-[var(--ink-mute)]">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--card-border-strong)] to-transparent" />
            <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[var(--saffron)]" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--card-border-strong)] to-transparent" />
        </div>
    );
}

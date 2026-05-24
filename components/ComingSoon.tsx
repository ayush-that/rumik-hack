import type { ReactNode } from "react";
import Sigil from "./Sigil";

export default function ComingSoon({
    icon,
    title,
    message,
}: {
    icon: ReactNode;
    title: string;
    message: string;
}) {
    return (
        <div className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-8 overflow-hidden">
            <div className="absolute text-[var(--saffron)] opacity-[0.12] pointer-events-none">
                <Sigil size={320} weight={0.6} spin />
            </div>
            <div className="relative text-[var(--saffron)] mb-4">{icon}</div>
            <p className="relative eyebrow text-[var(--ink-mute)]">Forthcoming</p>
            <h1
                className="relative mt-1 font-display text-3xl text-[var(--ink)]"
                style={{ fontVariationSettings: '"opsz" 72, "SOFT" 30', fontStyle: "italic" }}
            >
                {title}
            </h1>
            <p className="relative text-[var(--ink-faint)] mt-2 max-w-[280px] text-sm">{message}</p>
            <div className="relative mt-6 flex items-center gap-2 text-[var(--ink-mute)]">
                <span className="h-px w-8 bg-[var(--card-border-strong)]" />
                <span className="font-mono text-[10px] tracking-widest uppercase">coming soon</span>
                <span className="h-px w-8 bg-[var(--card-border-strong)]" />
            </div>
        </div>
    );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Phone, Sparkles } from "lucide-react";

const TABS = [
    { href: "/dashboard",          label: "Home",     Icon: Home },
    { href: "/dashboard/chat",     label: "Chat",     Icon: MessageSquare },
    { href: "/dashboard/call",     label: "Call",     Icon: Phone },
    { href: "/dashboard/remedies", label: "Remedies", Icon: Sparkles },
];

export default function BottomNav() {
    const pathname = usePathname();
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--vellum)]/95 backdrop-blur-md border-t border-x border-[var(--card-border-strong)] flex justify-around pt-2 pb-3 z-50">
            {TABS.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                    <Link
                        key={href}
                        href={href}
                        className="relative flex flex-col items-center gap-1 px-3 py-1"
                    >
                        {active && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-1 rotate-45 bg-[var(--saffron)]" />
                        )}
                        <Icon
                            size={20}
                            strokeWidth={active ? 2 : 1.5}
                            className={active ? "text-[var(--saffron)]" : "text-[var(--ink-faint)]"}
                        />
                        <span
                            className={
                                active
                                    ? "font-display text-[11px] text-[var(--ink)] tracking-wide"
                                    : "text-[10px] text-[var(--ink-faint)] tracking-wide uppercase"
                            }
                            style={active ? { fontVariationSettings: '"opsz" 14, "SOFT" 60', fontStyle: "italic" } : undefined}
                        >
                            {label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

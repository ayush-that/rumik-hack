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
        <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-white border-t border-[var(--card-border)] flex justify-around py-2 z-50">
            {TABS.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                    <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs">
                        <Icon size={22} strokeWidth={active ? 2.4 : 1.6} className={active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"} />
                        <span className={active ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

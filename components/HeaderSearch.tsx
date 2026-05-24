"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function HeaderSearch() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const initial = params.get("q") ?? "";

    const [open, setOpen] = useState(initial.length > 0);
    const [value, setValue] = useState(initial);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        const t = setTimeout(() => {
            const next = new URLSearchParams(params.toString());
            const v = value.trim();
            if (v) next.set("q", v);
            else next.delete("q");
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname);
        }, 200);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const close = () => {
        setValue("");
        setOpen(false);
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                aria-label="Search"
                className="text-[var(--ink-soft)] hover:text-[var(--saffron)] transition-colors"
            >
                <Search size={20} strokeWidth={1.6} />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-[var(--vellum)] border border-[var(--card-border-strong)] rounded-full px-3 py-1.5 w-full max-w-[240px]">
            <Search size={14} className="text-[var(--saffron)] shrink-0" strokeWidth={1.8} />
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && close()}
                placeholder="Find a counsellor"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--ink-mute)] text-[var(--ink)]"
            />
            <button onClick={close} aria-label="Close search" className="shrink-0 text-[var(--ink-faint)]">
                <X size={14} />
            </button>
        </div>
    );
}

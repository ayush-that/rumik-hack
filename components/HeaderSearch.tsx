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
            <button onClick={() => setOpen(true)} aria-label="Search">
                <Search size={22} className="text-zinc-700" />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-white border border-[var(--card-border)] rounded-full px-3 py-1.5 w-full max-w-[260px]">
            <Search size={16} className="text-zinc-500 shrink-0" />
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && close()}
                placeholder="Search counsellors"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
            <button onClick={close} aria-label="Close search" className="shrink-0">
                <X size={16} className="text-zinc-500" />
            </button>
        </div>
    );
}

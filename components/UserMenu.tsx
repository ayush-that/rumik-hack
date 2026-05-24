"use client";
import { signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function UserMenu({ initial }: { initial: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-700 font-semibold flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                {initial}
            </button>
            {open && (
                <div className="absolute left-0 mt-2 w-36 bg-white border border-[var(--card-border)] rounded-lg shadow-md z-50 overflow-hidden">
                    <Link
                        href="/dashboard/profile"
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                        Profile
                    </Link>
                    <button
                        onClick={async () => { setOpen(false); await signOut(); router.push("/sign-in"); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 border-t border-[var(--card-border)]"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

"use client";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ initial }: { initial: string }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    return (
        <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-700 font-semibold flex items-center justify-center">
                {initial}
            </button>
            {open && (
                <div className="absolute left-0 mt-2 w-32 bg-white border border-[var(--card-border)] rounded-lg shadow-md z-50">
                    <button
                        onClick={async () => { await signOut(); router.push("/sign-in"); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Phone, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import OnboardingForm from "./OnboardingForm";

interface Props {
    counsellorSlug: string;
    counsellorName: string;
    waitMinutes: number;
}

export default function CallNowButton({ counsellorSlug, counsellorName, waitMinutes }: Props) {
    const router = useRouter();
    const profile = useQuery(api.user.getProfile);
    const [open, setOpen] = useState(false);
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        router.prefetch(`/dashboard/call/${counsellorSlug}`);
    }, [router, counsellorSlug]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const available = waitMinutes === 0;

    const goToCall = () => {
        setNavigating(true);
        router.push(`/dashboard/call/${counsellorSlug}`);
    };

    const handleClick = () => {
        if (profile === undefined) return;
        if (profile && profile.onboarded) {
            goToCall();
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={profile === undefined || navigating}
                className={
                    available
                        ? "btn-saffron w-full disabled:opacity-60"
                        : "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sindoor-wash)] border border-[var(--sindoor-soft)] text-[var(--sindoor)] py-3.5 font-semibold disabled:opacity-60"
                }
            >
                <Phone size={18} strokeWidth={2} />
                {navigating
                    ? "Connecting…"
                    : available
                      ? `Call ${counsellorName.split(" ")[0]} now`
                      : `Call (wait ~ ${waitMinutes}m)`}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                    style={{ backgroundColor: "rgba(27, 22, 18, 0.55)", backdropFilter: "blur(4px)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    <div
                        className="relative w-full max-w-[480px] bg-[var(--paper)] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto border border-[var(--card-border-strong)] shadow-[0_-12px_40px_-12px_rgba(94,35,8,0.35)]"
                    >
                        {/* Drag handle */}
                        <div className="sm:hidden flex justify-center pt-2">
                            <span className="h-1 w-10 rounded-full bg-[var(--card-border-strong)]" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-[var(--vellum)]/90 border border-[var(--card-border-strong)] backdrop-blur flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--saffron)] transition-colors"
                            aria-label="Close"
                        >
                            <X size={16} strokeWidth={1.8} />
                        </button>
                        <OnboardingForm
                            counsellorName={counsellorName}
                            initialName={profile?.displayName ?? undefined}
                            action="call"
                            onDone={() => {
                                setOpen(false);
                                goToCall();
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

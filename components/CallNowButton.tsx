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

    // Prefetch the call route so navigation after onboarding feels instant.
    useEffect(() => {
        router.prefetch(`/dashboard/call/${counsellorSlug}`);
    }, [router, counsellorSlug]);

    // Lock body scroll while the modal is open.
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const available = waitMinutes === 0;
    const buttonClass = `flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold ${
        available ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"
    }`;

    const goToCall = () => {
        setNavigating(true);
        router.push(`/dashboard/call/${counsellorSlug}`);
    };

    const handleClick = () => {
        if (profile === undefined) return; // still loading
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
                className={`${buttonClass} disabled:opacity-60`}
            >
                <Phone size={18} />
                {navigating ? "Connecting…" : available ? "Call now" : `Call (wait ~ ${waitMinutes}m)`}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
                    <div className="relative w-full max-w-[480px] bg-[var(--background)] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-zinc-700"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                        <OnboardingForm
                            counsellorName={counsellorName}
                            initialName={profile?.displayName ?? undefined}
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

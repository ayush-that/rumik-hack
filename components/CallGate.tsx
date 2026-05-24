"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import VoiceCallClient from "@/components/VoiceCallClient";
import OnboardingForm from "@/components/OnboardingForm";

interface Counsellor {
    slug: string;
    name: string;
    portrait: string;
    specialties: string[];
    languages: string[];
    experienceYears: number;
}

export default function CallGate({ counsellor }: { counsellor: Counsellor }) {
    const profile = useQuery(api.user.getProfile);
    const [forceProceed, setForceProceed] = useState(false);

    if (profile === undefined) {
        return (
            <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center text-zinc-500 text-sm">
                Loading…
            </div>
        );
    }

    const ready = forceProceed || (profile && profile.onboarded);

    if (!ready) {
        return (
            <OnboardingForm
                counsellorName={counsellor.name}
                initialName={profile?.displayName ?? undefined}
                onDone={() => setForceProceed(true)}
            />
        );
    }

    return (
        <VoiceCallClient
            counsellor={counsellor}
            profile={{
                displayName: profile!.displayName,
                gender: profile!.gender,
                birthDate: profile!.birthDate,
                birthTime: profile!.birthTime,
                birthTimeUnknown: profile!.birthTimeUnknown,
                birthPlace: profile!.birthPlace,
            }}
        />
    );
}

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
    tagline?: string | null;
    signature?: string | null;
    hometown?: string | null;
    region?: string | null;
    personaPrompt?: string | null;
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

    if (!profile?.onboarded) {
        if (forceProceed) {
            return (
                <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center text-zinc-500 text-sm">
                    Saving your details…
                </div>
            );
        }

        return (
            <OnboardingForm
                counsellorName={counsellor.name}
                initialName={profile?.displayName ?? undefined}
                action="call"
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

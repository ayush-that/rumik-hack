"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AiChatClient, { type ChatCounsellor } from "@/components/AiChatClient";
import OnboardingForm from "@/components/OnboardingForm";

export default function ChatGate({
  counsellors,
  initialSlug,
}: {
  counsellors: ChatCounsellor[];
  initialSlug?: string;
}) {
  const profile = useQuery(api.user.getProfile);
  const [forceProceed, setForceProceed] = useState(false);
  const selected =
    counsellors.find((c) => c.slug === initialSlug) ?? counsellors[0];

  if (!selected) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 text-center text-zinc-500">
        No counsellors are available for chat.
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!profile?.onboarded) {
    if (forceProceed) {
      return (
        <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center text-sm text-zinc-500">
          Saving your details...
        </div>
      );
    }

    return (
      <OnboardingForm
        counsellorName={selected.name}
        initialName={profile?.displayName ?? undefined}
        action="chat"
        onDone={() => setForceProceed(true)}
      />
    );
  }

  return (
    <AiChatClient
      counsellor={selected}
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

import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import VoiceCallClient from "@/components/VoiceCallClient";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();

    return (
        <VoiceCallClient
            counsellor={{
                slug: c.slug,
                name: c.name,
                portrait: c.portrait,
                specialties: c.specialties,
                languages: c.languages,
                experienceYears: c.experienceYears,
            }}
        />
    );
}

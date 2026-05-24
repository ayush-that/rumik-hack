import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import CallGate from "@/components/CallGate";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();

    return (
        <CallGate
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

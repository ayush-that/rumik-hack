import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PhoneOff } from "lucide-react";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <Image src={c.portrait} alt={c.name} width={160} height={160} className="rounded-full object-cover h-40 w-40" />
            <h1 className="mt-4 text-2xl font-bold">{c.name}</h1>
            <p className="text-zinc-500 mt-1">Connecting…</p>
            <div className="mt-3 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:300ms]" />
            </div>
            <Link
                href={`/dashboard/counsellor/${c.slug}`}
                className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold"
            >
                <PhoneOff size={18} /> End
            </Link>
            <p className="text-xs text-zinc-400 mt-6">Voice agent integration coming soon.</p>
        </div>
    );
}

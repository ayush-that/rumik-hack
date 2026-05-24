import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Phone, Star } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

export default async function CounsellorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();
    const available = c.waitMinutes === 0;
    return (
        <div className="px-4 pt-3">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-zinc-600 mb-3">
                <ArrowLeft size={16} /> Back
            </Link>
            <div className="flex flex-col items-center text-center">
                <Image src={c.portrait} alt={c.name} width={140} height={140} className="rounded-full object-cover h-36 w-36" />
                <div className="flex gap-0.5 text-amber-400 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" strokeWidth={0} />)}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight flex items-center gap-2 justify-center">
                    {c.name} <VerifiedBadge size={20} />
                </h1>
                <p className="text-zinc-600">{c.specialties.join(" · ")}</p>
                <p className="text-zinc-600">{c.languages.join(", ")}</p>
                <p className="text-zinc-600">Exp- {c.experienceYears} Years · {c.ordersCount.toLocaleString()} orders</p>
                <p className="mt-2 text-lg">
                    <span className="text-zinc-400 line-through mr-2">₹{c.originalPricePerMin}</span>
                    <span className="text-red-500 font-semibold">₹{c.pricePerMin}/min</span>
                </p>
            </div>
            <Link
                href={`/dashboard/call/${c.slug}`}
                className={`mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold ${available ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"}`}
            >
                <Phone size={18} />
                {available ? "Call now" : `Call (wait ~ ${c.waitMinutes}m)`}
            </Link>
        </div>
    );
}

import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import RatingStars from "@/components/RatingStars";

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
                <div className="mt-3 flex items-center gap-1.5">
                    <RatingStars rating={c.rating} size={16} />
                    <span className="text-sm text-zinc-600">{c.rating.toFixed(1)}</span>
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
            <div className="mt-8 grid grid-cols-2 gap-3">
                <Link
                    href={`/dashboard/chat?counsellor=${c.slug}`}
                    className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white py-3 font-semibold text-zinc-800"
                >
                    <MessageCircle size={18} />
                    Chat
                </Link>
                <Link
                    href={`/dashboard/call/${c.slug}`}
                    className={`flex items-center justify-center gap-2 rounded-full py-3 font-semibold ${available ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"}`}
                >
                    <Phone size={18} />
                    {available ? "Call now" : `Wait ${c.waitMinutes}m`}
                </Link>
            </div>
        </div>
    );
}

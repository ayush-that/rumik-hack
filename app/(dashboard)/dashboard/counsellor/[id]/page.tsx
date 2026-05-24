import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, Phone, Quote } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import RatingStars from "@/components/RatingStars";
import { generateReviews, formatRelativeDays } from "@/lib/reviews";

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
                {c.tagline && (
                    <p className="mt-1 text-sm italic text-zinc-500 max-w-xs">&ldquo;{c.tagline}&rdquo;</p>
                )}
                {c.hometown && (
                    <p className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-600">
                        <MapPin size={14} /> {c.hometown}
                        {c.region ? <span className="text-zinc-400">· {c.region}</span> : null}
                    </p>
                )}
                <p className="text-zinc-600 mt-1">{c.languages.join(", ")}</p>
                <p className="text-zinc-600">Exp- {c.experienceYears} Years · {c.ordersCount.toLocaleString()} orders</p>
                <p className="mt-2 text-lg">
                    <span className="text-zinc-400 line-through mr-2">₹{c.originalPricePerMin}</span>
                    <span className="text-red-500 font-semibold">₹{c.pricePerMin}/min</span>
                </p>
            </div>

            {c.bio && (
                <section className="mt-5 rounded-2xl bg-white border border-[var(--card-border)] p-4">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">About</h2>
                    <p className="mt-2 text-sm text-zinc-700 leading-relaxed">{c.bio}</p>
                </section>
            )}

            <section className="mt-4 rounded-2xl bg-white border border-[var(--card-border)] p-4">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Specialties</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.specialties.map((s) => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {s}
                        </span>
                    ))}
                </div>
            </section>

            {c.signature && (
                <section className="mt-4 rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
                    <Quote size={18} className="text-yellow-600" />
                    <p className="mt-2 text-sm italic text-zinc-700 leading-relaxed">{c.signature}</p>
                    <p className="mt-2 text-xs text-zinc-500">— {c.name.split(" ")[0]}&rsquo;s signature line</p>
                </section>
            )}

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

            <section className="mt-10">
                <div className="flex items-baseline justify-between mb-3">
                    <h2 className="text-lg font-semibold">Reviews</h2>
                    <span className="text-sm text-zinc-500">{c.ordersCount.toLocaleString()} calls</span>
                </div>
                <ul className="space-y-3 pb-8">
                    {generateReviews(c.slug, c.rating, 5).map((r, i) => (
                        <li key={i} className="rounded-2xl bg-white border border-[var(--card-border)] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-center shrink-0">
                                        {r.name[0]}
                                    </div>
                                    <span className="font-medium truncate">{r.name}</span>
                                </div>
                                <span className="text-xs text-zinc-500 shrink-0">{formatRelativeDays(r.daysAgo)}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <RatingStars rating={r.rating} size={12} />
                                <span className="text-xs text-zinc-600">{r.rating.toFixed(1)}</span>
                            </div>
                            <p className="mt-2 text-sm text-zinc-700">{r.text}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

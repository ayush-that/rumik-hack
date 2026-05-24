import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import RatingStars from "@/components/RatingStars";
import { MessageCircle } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function formatOrders(n: number) {
    if (n >= 10000) return `${Math.floor(n / 1000)}k+ orders`;
    if (n >= 1000)  return `${Math.floor(n / 1000)}k+ orders`;
    return `${n} orders`;
}

export default function CounsellorCard({ c, priority = false }: { c: Doc<"counsellors">; priority?: boolean }) {
    const available = c.waitMinutes === 0;
    return (
        <article className="mx-4 my-3 rounded-2xl bg-white border border-[var(--card-border)] p-4 flex gap-3">
            <Link href={`/dashboard/counsellor/${c.slug}`} className="shrink-0">
                <Image src={c.portrait} alt={c.name} width={88} height={88} priority={priority} className="rounded-full object-cover h-22 w-22" />
                <div className="flex justify-center mt-2">
                    <RatingStars rating={c.rating} size={12} />
                </div>
                <p className="text-[10px] text-zinc-500 text-center mt-0.5">{formatOrders(c.ordersCount)}</p>
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold tracking-tight truncate">{c.name}</h3>
                    <VerifiedBadge size={18} className="shrink-0" />
                </div>
                {c.tagline && (
                    <p className="text-xs italic text-zinc-500 line-clamp-2 mt-0.5">&ldquo;{c.tagline}&rdquo;</p>
                )}
                <p className="text-sm text-zinc-600 truncate mt-1">{c.specialties.join(" · ")}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span className="truncate">{c.languages.join(", ")}</span>
                </div>
                {c.hometown && (
                    <p className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5 truncate">
                        <MapPin size={11} className="shrink-0" /> {c.hometown} · {c.experienceYears}y
                    </p>
                )}
                <p className="text-sm mt-1">
                    <span className="text-zinc-400 line-through">₹{c.originalPricePerMin}</span>{" "}
                    <span className="text-red-500 font-semibold">₹{c.pricePerMin}/min</span>
                </p>
            </div>

            <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
                <Link
                    href={`/dashboard/call/${c.slug}`}
                    className={`px-6 py-2 rounded-full border text-sm font-semibold ${available ? "border-emerald-500 text-emerald-600" : "border-red-400 text-red-500"}`}
                >
                    Call
                </Link>
                <Link
                    href={`/dashboard/chat?counsellor=${c.slug}`}
                    className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700"
                >
                    <MessageCircle size={13} />
                    Chat
                </Link>
                {!available && <span className="text-xs text-red-400">wait ~ {c.waitMinutes}m</span>}
            </div>
        </article>
    );
}

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function formatOrders(n: number) {
    if (n >= 10000) return "10k+ orders";
    if (n >= 5000)  return "5k+ orders";
    if (n >= 1000)  return `${Math.floor(n / 1000)}k+ orders`;
    return `${n} orders`;
}

export default function CounsellorCard({ c, priority = false }: { c: Doc<"counsellors">; priority?: boolean }) {
    const available = c.waitMinutes === 0;
    return (
        <article className="mx-4 my-3 rounded-2xl bg-white border border-[var(--card-border)] p-4 flex gap-3">
            <Link href={`/dashboard/counsellor/${c.slug}`} className="shrink-0">
                <Image src={c.portrait} alt={c.name} width={88} height={88} priority={priority} className="rounded-full object-cover h-22 w-22" />
                <div className="flex justify-center mt-2 gap-0.5 text-zinc-300">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                </div>
                <p className="text-[10px] text-zinc-500 text-center mt-0.5">{formatOrders(c.ordersCount)}</p>
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold tracking-tight truncate">{c.name}</h3>
                    <BadgeCheck size={18} className="shrink-0 text-emerald-500 fill-emerald-500/15" />
                </div>
                <p className="text-sm text-zinc-600 truncate">{c.specialties.join(",  ")}</p>
                <p className="text-sm text-zinc-600 truncate">{c.languages.join(", ")}</p>
                <p className="text-sm text-zinc-600">Exp- {c.experienceYears} Years</p>
                <p className="text-sm">
                    <span className="text-zinc-400 line-through">₹{c.originalPricePerMin}</span>{" "}
                    <span className="text-red-500 font-semibold">₹{c.pricePerMin}/min</span>
                </p>
            </div>

            <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                <Link
                    href={`/dashboard/call/${c.slug}`}
                    className={`px-6 py-2 rounded-full border text-sm font-semibold ${available ? "border-emerald-500 text-emerald-600" : "border-red-400 text-red-500"}`}
                >
                    Call
                </Link>
                {!available && <span className="text-xs text-red-400">wait ~ {c.waitMinutes}m</span>}
            </div>
        </article>
    );
}

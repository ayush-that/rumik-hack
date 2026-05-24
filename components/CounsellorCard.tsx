import Image from "next/image";
import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import RatingStars from "@/components/RatingStars";
import Sigil from "@/components/Sigil";
import type { Doc } from "@/convex/_generated/dataModel";

function formatOrders(n: number) {
    if (n >= 1000) return `${Math.floor(n / 1000)}k`;
    return `${n}`;
}

// Editorial card — like an entry in an almanac: numbered, named in serif,
// a hairline divider, a single muted line of context, two purposeful CTAs.
export default function CounsellorCard({
    c,
    priority = false,
    index = 0,
}: {
    c: Doc<"counsellors">;
    priority?: boolean;
    index?: number;
}) {
    const available = c.waitMinutes === 0;
    const firstName = c.name.split(" ")[0];
    const num = String(index + 1).padStart(2, "0");

    return (
        <article className="card-paper relative mx-4 my-3 overflow-hidden">
            {/* Faint sigil behind portrait — page-turn motif */}
            <div className="absolute -right-6 -top-6 text-[var(--saffron)] opacity-[0.09] pointer-events-none">
                <Sigil size={140} weight={0.9} />
            </div>

            <Link
                href={`/dashboard/counsellor/${c.slug}`}
                className="relative flex items-start gap-3.5 p-4 pb-3"
            >
                {/* Portrait with sigil halo ring */}
                <div className="relative shrink-0">
                    <span className="absolute -inset-1.5 rounded-full border border-[var(--card-border-strong)]" />
                    <Image
                        src={c.portrait}
                        alt={c.name}
                        width={84}
                        height={84}
                        priority={priority}
                        className="relative rounded-full object-cover h-[84px] w-[84px] ring-1 ring-[var(--paper-edge)]"
                    />
                    {/* Availability sliver */}
                    <span
                        className={`absolute -bottom-0.5 right-0 h-3 w-3 rounded-full border-2 border-[var(--vellum)] ${
                            available ? "bg-[var(--peacock)]" : "bg-[var(--sindoor-soft)]"
                        }`}
                        aria-label={available ? "Available" : "Busy"}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] text-[var(--ink-mute)] tracking-widest">
                            №&nbsp;{num}
                        </span>
                        <span className="h-px flex-1 bg-[var(--card-border-strong)]" />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <h3
                            className="font-display text-[1.35rem] leading-[1.05] text-[var(--ink)] truncate"
                            style={{ fontVariationSettings: '"opsz" 48, "SOFT" 50' }}
                        >
                            {c.name}
                        </h3>
                        <VerifiedBadge size={15} className="shrink-0 text-[var(--peacock)]" />
                    </div>
                    {c.tagline ? (
                        <p
                            className="text-[12px] leading-snug text-[var(--ink-faint)] line-clamp-2 mt-0.5 italic"
                            style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 14' }}
                        >
                            {c.tagline}
                        </p>
                    ) : (
                        <p className="text-[12px] text-[var(--ink-faint)] truncate mt-0.5">
                            {c.specialties.join(" · ")}
                        </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--ink-soft)] flex-wrap">
                        <span className="font-medium nums">{c.experienceYears}y</span>
                        <span className="text-[var(--card-border-strong)]">/</span>
                        <span className="truncate max-w-[140px]">{c.hometown ?? c.languages[0]}</span>
                        <span className="text-[var(--card-border-strong)]">/</span>
                        <span className="inline-flex items-center gap-0.5">
                            <RatingStars rating={c.rating} size={10} />
                            <span className="ml-0.5 nums">{c.rating.toFixed(1)}</span>
                            <span className="text-[var(--ink-mute)] mx-0.5">·</span>
                            <span className="nums">{formatOrders(c.ordersCount)}+ calls</span>
                        </span>
                    </div>
                </div>
            </Link>

            {/* Hairline rule */}
            <div className="relative mx-4 h-px bg-gradient-to-r from-transparent via-[var(--card-border-strong)] to-transparent" />

            {/* Footer — price + CTAs */}
            <div className="relative flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col leading-tight">
                    <span className="eyebrow text-[var(--ink-mute)]">From</span>
                    <span className="font-display text-base text-[var(--ink)] nums">
                        <span className="text-[var(--ink-mute)] line-through text-sm mr-1.5">
                            ₹{c.originalPricePerMin}
                        </span>
                        ₹{c.pricePerMin}
                        <span className="text-[var(--ink-faint)] text-xs"> /min</span>
                    </span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <Link
                        href={`/dashboard/chat?counsellor=${c.slug}`}
                        aria-label={`Chat with ${firstName}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border-strong)] bg-[var(--paper)] px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] hover:border-[var(--saffron-soft)] transition-colors"
                    >
                        <MessageCircle size={13} strokeWidth={1.7} />
                        Chat
                    </Link>
                    <Link
                        href={`/dashboard/counsellor/${c.slug}`}
                        aria-label={`Call ${firstName}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            available
                                ? "bg-[var(--peacock)] text-[var(--paper)] hover:brightness-110"
                                : "bg-[var(--sindoor-wash)] text-[var(--sindoor)] border border-[var(--sindoor-soft)]"
                        }`}
                    >
                        <Phone size={13} strokeWidth={2} />
                        {available ? "Call" : `${c.waitMinutes}m`}
                    </Link>
                </div>
            </div>
        </article>
    );
}

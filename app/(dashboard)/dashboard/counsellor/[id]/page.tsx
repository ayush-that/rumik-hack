import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, Phone } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import RatingStars from "@/components/RatingStars";
import Sigil from "@/components/Sigil";
import Ornament from "@/components/Ornament";
import { generateReviews, formatRelativeDays } from "@/lib/reviews";

export default async function CounsellorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();

    const available = c.waitMinutes === 0;
    const firstName = c.name.split(" ")[0];

    return (
        <div className="relative">
            {/* Back chevron — minimal, ink */}
            <div className="px-4 pt-3">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-faint)] hover:text-[var(--saffron)] transition-colors"
                >
                    <ArrowLeft size={14} strokeWidth={1.7} /> Back to council
                </Link>
            </div>

            {/* ---------- Hero ---------- */}
            <section className="relative px-6 pt-2 pb-6 text-center overflow-hidden">
                {/* Sigil halo behind portrait */}
                <div className="absolute left-1/2 -translate-x-1/2 top-6 text-[var(--saffron)] opacity-30 pointer-events-none">
                    <Sigil size={280} weight={0.7} spin />
                </div>

                <div className="relative inline-block ink-reveal">
                    <Image
                        src={c.portrait}
                        alt={c.name}
                        width={148}
                        height={148}
                        priority
                        className="rounded-full object-cover h-[148px] w-[148px] ring-1 ring-[var(--card-border-strong)] shadow-[0_8px_30px_-12px_rgba(94,35,8,0.35)]"
                    />
                    <span
                        className={`absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            available
                                ? "bg-[var(--peacock-wash)] border-[var(--peacock-soft)] text-[var(--peacock)]"
                                : "bg-[var(--sindoor-wash)] border-[var(--sindoor-soft)] text-[var(--sindoor)]"
                        }`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[var(--peacock)] pulse-ring" : "bg-[var(--sindoor)]"}`} />
                        {available ? "Live" : `${c.waitMinutes}m`}
                    </span>
                </div>

                <p className="eyebrow mt-5 ink-reveal ink-reveal-delay-1">
                    Counsellor · {c.region ?? "India"}
                </p>
                <h1
                    className="mt-1 font-display text-[2.5rem] leading-[1.05] text-[var(--ink)] flex items-center justify-center gap-2 ink-reveal ink-reveal-delay-1"
                    style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
                >
                    {c.name}
                    <VerifiedBadge size={22} className="text-[var(--peacock)]" />
                </h1>

                {c.tagline && (
                    <p
                        className="mt-3 mx-auto max-w-[300px] text-[15px] leading-snug text-[var(--ink-soft)] italic ink-reveal ink-reveal-delay-2"
                        style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 20' }}
                    >
                        &ldquo;{c.tagline}&rdquo;
                    </p>
                )}

                {c.hometown && (
                    <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--ink-faint)] ink-reveal ink-reveal-delay-2">
                        <MapPin size={12} strokeWidth={1.6} />
                        {c.hometown}
                    </p>
                )}

                {/* Stat strip — three big numbers in serif */}
                <div className="mt-6 grid grid-cols-3 gap-2 ink-reveal ink-reveal-delay-3">
                    {[
                        { label: "Experience", value: `${c.experienceYears}`, suffix: "yrs" },
                        { label: "Rating", value: c.rating.toFixed(1), suffix: "/5" },
                        {
                            label: "Sessions",
                            value: c.ordersCount >= 1000 ? `${Math.floor(c.ordersCount / 1000)}k` : `${c.ordersCount}`,
                            suffix: "+",
                        },
                    ].map((s) => (
                        <div key={s.label} className="card-paper px-3 py-3 text-center">
                            <p
                                className="font-display text-[1.6rem] leading-none text-[var(--ink)] nums"
                                style={{ fontVariationSettings: '"opsz" 60, "SOFT" 40' }}
                            >
                                {s.value}
                                <span className="text-[0.6rem] text-[var(--ink-faint)] align-top ml-0.5">
                                    {s.suffix}
                                </span>
                            </p>
                            <p className="eyebrow mt-1 text-[var(--ink-mute)]">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Rating row */}
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--ink-faint)]">
                    <RatingStars rating={c.rating} size={12} />
                    <span className="nums">{c.rating.toFixed(1)} from {c.ordersCount.toLocaleString()} sessions</span>
                </div>
            </section>

            {/* ---------- Bio ---------- */}
            {c.bio && (
                <section className="px-5 pb-2">
                    <Ornament label="About" />
                    <p
                        className="text-[15px] leading-relaxed text-[var(--ink-soft)] mt-2"
                        style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 18, "SOFT" 60' }}
                    >
                        {/* Drop cap for the first letter */}
                        <span
                            className="float-left mr-2 font-display leading-[0.85] text-[var(--saffron)] text-[3.4rem] mt-1"
                            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
                        >
                            {c.bio.charAt(0)}
                        </span>
                        {c.bio.slice(1)}
                    </p>
                </section>
            )}

            {/* ---------- Specialties ---------- */}
            <section className="px-5 mt-4">
                <Ornament label="Specialties" />
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.specialties.map((s) => (
                        <span
                            key={s}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--saffron-wash)] border border-[var(--saffron-soft)]/60 px-3 py-1 text-xs text-[var(--saffron-ink)]"
                        >
                            <span className="inline-block h-1 w-1 rotate-45 bg-[var(--saffron)]" />
                            {s}
                        </span>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
                    <span className="eyebrow text-[var(--ink-mute)]">Languages</span>
                    <span className="h-px flex-1 bg-[var(--card-border)]" />
                    <span className="font-medium text-[var(--ink-soft)]">{c.languages.join(" · ")}</span>
                </div>
            </section>

            {/* ---------- Signature pull-quote ---------- */}
            {c.signature && (
                <section className="px-5 mt-6">
                    <blockquote className="relative card-paper px-5 py-5 bg-[var(--saffron-wash)] border-[var(--saffron-soft)]/50">
                        {/* Floating sigil */}
                        <div className="absolute right-3 top-3 text-[var(--saffron)]/30">
                            <Sigil size={48} weight={0.6} />
                        </div>
                        {/* Big serif open-quote */}
                        <span
                            className="absolute -left-1 -top-3 font-display text-[5rem] leading-none text-[var(--saffron)] select-none pointer-events-none"
                            style={{ fontVariationSettings: '"opsz" 144' }}
                        >
                            &ldquo;
                        </span>
                        <p
                            className="relative pl-6 text-[1.05rem] leading-snug text-[var(--ink)] italic"
                            style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 24, "SOFT" 80' }}
                        >
                            {c.signature}
                        </p>
                        <footer className="relative mt-3 pl-6 eyebrow text-[var(--ink-faint)]">
                            — {firstName}&rsquo;s signature line
                        </footer>
                    </blockquote>
                </section>
            )}

            {/* ---------- Price ledger ---------- */}
            <section className="px-5 mt-6">
                <Ornament label="The Rate" />
                <div className="mt-3 flex items-baseline justify-center gap-3">
                    <span className="font-display text-2xl text-[var(--ink-mute)] line-through nums">
                        ₹{c.originalPricePerMin}
                    </span>
                    <span
                        className="font-display text-[3rem] leading-none text-[var(--saffron)] nums"
                        style={{ fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
                    >
                        ₹{c.pricePerMin}
                    </span>
                    <span className="font-display text-base text-[var(--ink-faint)]">/min</span>
                </div>
                <p className="mt-1 text-center text-xs text-[var(--ink-faint)]">
                    First minute free for new callers
                </p>
            </section>

            {/* ---------- CTAs ---------- */}
            <section className="px-5 mt-7 grid grid-cols-[1fr_1.5fr] gap-2.5">
                <Link
                    href={`/dashboard/chat?counsellor=${c.slug}`}
                    className="btn-outline"
                >
                    <MessageCircle size={17} strokeWidth={1.7} />
                    Chat
                </Link>
                <Link
                    href={`/dashboard/call/${c.slug}`}
                    className={
                        available
                            ? "btn-saffron"
                            : "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--sindoor-wash)] border border-[var(--sindoor-soft)] text-[var(--sindoor)] py-3.5 font-semibold"
                    }
                >
                    <Phone size={17} strokeWidth={2} />
                    {available ? `Call ${firstName}` : `Wait ${c.waitMinutes}m`}
                </Link>
            </section>

            {/* ---------- Reviews ---------- */}
            <section className="px-5 mt-10">
                <Ornament label="What clients say" />
                <div className="flex items-baseline justify-between mt-3 mb-3">
                    <h2
                        className="font-display text-2xl text-[var(--ink)]"
                        style={{ fontVariationSettings: '"opsz" 48, "SOFT" 50', fontStyle: "italic" }}
                    >
                        Recent readings
                    </h2>
                    <span className="font-mono text-[10px] tracking-widest text-[var(--ink-faint)] nums">
                        {c.ordersCount.toLocaleString()}
                    </span>
                </div>
                <ul className="space-y-3 pb-8">
                    {generateReviews(c.slug, c.rating, 5).map((r, i) => (
                        <li key={i} className="card-paper p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className="h-9 w-9 rounded-full bg-[var(--paper-deep)] border border-[var(--card-border-strong)] text-[var(--ink-soft)] font-display text-base flex items-center justify-center shrink-0"
                                        style={{ fontVariationSettings: '"opsz" 24' }}
                                    >
                                        {r.name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-[var(--ink)] truncate text-sm">{r.name}</p>
                                        <div className="flex items-center gap-1.5">
                                            <RatingStars rating={r.rating} size={10} />
                                            <span className="text-[10px] text-[var(--ink-faint)] nums">
                                                {r.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] eyebrow text-[var(--ink-mute)] shrink-0">
                                    {formatRelativeDays(r.daysAgo)}
                                </span>
                            </div>
                            <p
                                className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed"
                                style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 16' }}
                            >
                                {r.text}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

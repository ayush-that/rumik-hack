import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isAuthenticated } from "@/lib/auth-server";
import Sigil from "@/components/Sigil";
import LegalDialog from "@/components/LegalDialog";

const PILLARS = [
    "Marriage",
    "Health",
    "Wealth",
    "Career",
    "Legal",
    "Finance",
];

export default async function LandingPage() {
    const authed = await isAuthenticated();
    return (
        <section className="relative flex min-h-[calc(100dvh-60px)] flex-col px-6 pb-6">
            <div className="relative flex flex-1 flex-col items-center justify-center text-center">
                {/* Sigil halo behind hero */}
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] text-[var(--saffron)] opacity-[0.14]">
                    <Sigil size={320} weight={0.7} spin />
                </div>

                <div className="relative flex flex-col items-center">
                    <p className="eyebrow text-[var(--ink-faint)]">The Almanac</p>
                    <h1
                        className="mt-3 font-display text-[2.75rem] leading-[1.05] text-[var(--ink)]"
                        style={{ fontVariationSettings: '"opsz" 80, "SOFT" 30' }}
                    >
                        Speak with a<br />
                        <span className="italic text-[var(--saffron-ink)]">verified astrologer</span>
                    </h1>
                    <p className="mt-4 max-w-[20rem] text-[15px] leading-relaxed text-[var(--ink-soft)]">
                        Marriage, health, wealth, legal, finance, career — guidance from the council, on a call, within minutes.
                    </p>

                    <Link
                        href={authed ? "/dashboard" : "/sign-up"}
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--saffron)] px-7 py-3.5 text-[var(--paper)] font-semibold shadow-[0_8px_22px_-10px_rgba(94,35,8,0.55)] transition-transform active:scale-95"
                    >
                        {authed ? "Browse counsellors" : "Begin your reading"}
                        <ArrowRight size={17} strokeWidth={2.25} />
                    </Link>

                    <Link
                        href={authed ? "/dashboard" : "/sign-in"}
                        className="mt-3 text-xs text-[var(--ink-faint)] underline-offset-4 hover:underline"
                    >
                        {authed ? "Open dashboard" : "Already a member? Sign in"}
                    </Link>
                </div>

                <div className="rule relative mt-12 w-full">
                    <span className="rule-diamond" />
                </div>

                <div className="relative mt-8 w-full">
                    <p className="eyebrow text-center text-[var(--ink-faint)]">What you can ask</p>
                    <ul className="mt-4 grid grid-cols-2 gap-2">
                        {PILLARS.map((p) => (
                            <li
                                key={p}
                                className="rounded-2xl bg-[var(--vellum)] border border-[var(--card-border)] px-3.5 py-3 text-sm text-[var(--ink-soft)] text-center"
                            >
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative mt-8 w-full rounded-2xl border border-[var(--card-border-strong)] bg-[var(--saffron-wash)]/60 px-5 py-4 text-center">
                    <p className="eyebrow text-[var(--saffron-ink)]">Trust</p>
                    <p
                        className="mt-1 font-display text-lg italic text-[var(--saffron-ink)]"
                        style={{ fontVariationSettings: '"opsz" 24' }}
                    >
                        Every counsellor is vetted, every reading is private.
                    </p>
                </div>
            </div>

            <div className="relative pt-8">
                <LegalDialog />
            </div>
        </section>
    );
}

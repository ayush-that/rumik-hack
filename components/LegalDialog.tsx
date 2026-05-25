"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type LegalKind = "about" | "terms" | "privacy";

const TITLES: Record<LegalKind, string> = {
    about: "About Tara",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
};

const BODIES: Record<LegalKind, { heading: string; paragraphs: string[] }[]> = {
    about: [
        {
            heading: "An almanac for the modern seeker",
            paragraphs: [
                "Tara is a council of verified astrologers, mediums, and counsellors brought together in one quiet place. We pair the precision of traditional jyotish with the warmth of a real conversation — voice or chat, in your language, in your moment.",
                "Every counsellor in the council is vetted for lineage, experience, and care. We do not list everyone who applies. We list the ones we would call ourselves.",
            ],
        },
        {
            heading: "How it works",
            paragraphs: [
                "Pick a counsellor whose voice you trust. Begin a call or open a chat. Ask about marriage, health, wealth, career, legal matters, or finance. The reading is yours — saved privately to your almanac, never shared.",
            ],
        },
        {
            heading: "Made with intention",
            paragraphs: [
                "Tara was built by a small team in 2026 who believe ancient guidance deserves a calmer interface than today's internet offers. We are still early — write to us if something feels off.",
            ],
        },
    ],
    terms: [
        {
            heading: "Acceptance",
            paragraphs: [
                "By creating an account or using Tara you agree to these terms. If you do not agree, please do not use the service.",
            ],
        },
        {
            heading: "Nature of guidance",
            paragraphs: [
                "Readings on Tara are for reflection and personal insight. They are not a substitute for medical, legal, financial, or psychological advice. Always consult a qualified professional for matters that materially affect your health, safety, or finances.",
            ],
        },
        {
            heading: "Your account",
            paragraphs: [
                "You are responsible for the activity on your account and for keeping your sign-in credentials secure. You agree to provide accurate information and to use Tara only for personal, non-commercial purposes.",
            ],
        },
        {
            heading: "Payments and refunds",
            paragraphs: [
                "Some readings and remedies may be paid. Charges are shown before you confirm. Refunds for technical failures (a dropped call before the counsellor speaks, for example) are issued automatically; refunds for completed readings are at our discretion.",
            ],
        },
        {
            heading: "Content and conduct",
            paragraphs: [
                "Do not harass counsellors or other members, do not record sessions without consent, and do not redistribute readings. We may suspend accounts that violate this.",
            ],
        },
        {
            heading: "Changes",
            paragraphs: [
                "We may update these terms as the service evolves. Material changes will be announced inside the app at least seven days before they take effect.",
            ],
        },
    ],
    privacy: [
        {
            heading: "What we collect",
            paragraphs: [
                "We collect your name, email, birth details (date, time, place) if you choose to share them, the messages and call transcripts produced inside Tara, and basic device metadata used to deliver and secure the service.",
            ],
        },
        {
            heading: "Why we collect it",
            paragraphs: [
                "Birth details are used to compute charts for your readings. Transcripts let you revisit past conversations. Device metadata is used for fraud prevention and product analytics, never sold.",
            ],
        },
        {
            heading: "Who can see it",
            paragraphs: [
                "Your readings are visible only to you and the counsellor you chose to speak with. Tara staff may access them in narrow cases — to investigate a reported issue, to comply with a legal request, or with your explicit permission for support.",
            ],
        },
        {
            heading: "Where it lives",
            paragraphs: [
                "Data is stored on managed cloud infrastructure (Convex, Vercel) and protected in transit by TLS and at rest by provider-managed encryption.",
            ],
        },
        {
            heading: "Your rights",
            paragraphs: [
                "You can export your readings, correct your profile, or delete your account at any time from your profile page. Deletion removes your readings within 30 days, except where retention is required by law.",
            ],
        },
        {
            heading: "Contact",
            paragraphs: [
                "Questions about privacy can be sent to privacy@tara.app.",
            ],
        },
    ],
};

export function LegalContent({ kind }: { kind: LegalKind }) {
    return (
        <article className="space-y-6 text-[var(--ink-soft)]">
            {BODIES[kind].map((section, i) => (
                <section key={i}>
                    <h3
                        className="font-display text-lg text-[var(--ink)]"
                        style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
                    >
                        {section.heading}
                    </h3>
                    {section.paragraphs.map((p, j) => (
                        <p key={j} className="mt-2 text-sm leading-relaxed">
                            {p}
                        </p>
                    ))}
                </section>
            ))}
        </article>
    );
}

export default function LegalDialog() {
    const [kind, setKind] = useState<LegalKind | null>(null);

    useEffect(() => {
        if (!kind) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setKind(null);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [kind]);

    return (
        <>
            <nav className="flex items-center justify-center gap-2 text-[11px] tracking-widest uppercase text-[var(--ink-mute)]">
                <LegalButton onClick={() => setKind("about")}>About</LegalButton>
                <span>·</span>
                <LegalButton onClick={() => setKind("terms")}>Terms</LegalButton>
                <span>·</span>
                <LegalButton onClick={() => setKind("privacy")}>Privacy</LegalButton>
            </nav>

            {kind && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#1b1612]/55 backdrop-blur-sm"
                    onClick={() => setKind(null)}
                >
                    <div
                        className="relative w-full max-w-[480px] max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[var(--paper)] border border-[var(--card-border-strong)] shadow-[0_-12px_40px_-12px_rgba(94,35,8,0.35)] sm:shadow-[0_20px_60px_-20px_rgba(94,35,8,0.45)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--paper)]/95 backdrop-blur rounded-t-3xl border-b border-[var(--card-border)]">
                            <div className="flex flex-col leading-none">
                                <span className="eyebrow">Tara</span>
                                <h2
                                    className="mt-1 font-display text-xl text-[var(--ink)]"
                                    style={{ fontVariationSettings: '"opsz" 36, "SOFT" 30' }}
                                >
                                    {TITLES[kind]}
                                </h2>
                            </div>
                            <button
                                onClick={() => setKind(null)}
                                aria-label="Close"
                                className="grid h-9 w-9 place-items-center rounded-full text-[var(--ink-faint)] hover:bg-[var(--paper-deep)] transition-colors"
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-5 py-5">
                            <LegalContent kind={kind} />
                            <p className="mt-8 text-[11px] tracking-widest uppercase text-[var(--ink-mute)] text-center">
                                Last updated · May 2026
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function LegalButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="hover:text-[var(--ink-faint)] transition-colors"
        >
            {children}
        </button>
    );
}

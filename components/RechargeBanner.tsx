import Sigil from "./Sigil";

export default function RechargeBanner() {
    return (
        <div className="relative mx-4 mt-3 overflow-hidden rounded-2xl border border-[var(--saffron-soft)]/60 bg-[var(--saffron-wash)] px-6 py-5 text-center">
            <div className="absolute -right-4 -top-4 text-[var(--saffron)] opacity-25 pointer-events-none">
                <Sigil size={120} weight={0.8} />
            </div>
            <p className="relative eyebrow text-[var(--saffron)]">A gift</p>
            <h2
                className="relative font-display text-3xl text-[var(--saffron-ink)] mt-1"
                style={{ fontVariationSettings: '"opsz" 72, "SOFT" 30', fontStyle: "italic" }}
            >
                100% cashback
            </h2>
            <div className="relative my-2.5 flex items-center justify-center gap-2 text-[10px] tracking-widest text-[var(--saffron-ink)]/70">
                <span className="h-px flex-1 bg-[var(--saffron-soft)]/40" />
                <span className="inline-block h-1 w-1 rotate-45 bg-[var(--saffron)]" />
                ON YOUR FIRST RECHARGE
                <span className="inline-block h-1 w-1 rotate-45 bg-[var(--saffron)]" />
                <span className="h-px flex-1 bg-[var(--saffron-soft)]/40" />
            </div>
            <button className="btn-saffron relative mt-1 px-7 py-2.5 text-sm tracking-wide">
                Recharge now
            </button>
        </div>
    );
}

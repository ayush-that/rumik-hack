export default function RechargeBanner() {
    return (
        <div className="mx-4 mt-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-6 py-5 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">100% Cashback!</h2>
            <div className="my-2 flex items-center justify-center gap-2 text-xs tracking-widest text-zinc-500">
                <span className="h-px flex-1 bg-zinc-300" />
                ON FIRST RECHARGE
                <span className="h-px flex-1 bg-zinc-300" />
            </div>
            <button className="mt-1 rounded-full bg-[var(--accent-yellow)] px-6 py-2 text-sm font-bold tracking-wide">
                RECHARGE NOW
            </button>
        </div>
    );
}

import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import Sigil from "@/components/Sigil";

export default async function AuthLayout({ children }: PropsWithChildren) {
    if (await isAuthenticated()) {
        redirect("/");
    }
    return (
        <main className="relative mx-auto w-full max-w-[480px] min-h-screen bg-[var(--paper)] border-x border-[var(--card-border)] flex flex-col overflow-hidden">
            <div className="absolute -left-16 -top-16 text-[var(--saffron)] opacity-[0.10] pointer-events-none">
                <Sigil size={260} weight={0.7} spin />
            </div>
            <div className="absolute -right-20 -bottom-20 text-[var(--peacock)] opacity-[0.10] pointer-events-none">
                <Sigil size={300} weight={0.65} />
            </div>

            <header className="relative flex flex-col items-center pt-14 pb-4">
                <div className="relative text-[var(--saffron)]">
                    <Sigil size={68} weight={1.1} spin />
                </div>
                <h1
                    className="mt-3 font-display text-[2rem] leading-none text-[var(--ink)]"
                    style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30', fontStyle: "italic" }}
                >
                    Tara
                </h1>
                <p className="mt-1 eyebrow text-[var(--ink-faint)]">An almanac for the soul</p>
            </header>

            <section className="relative flex-1 flex items-center justify-center px-6 py-4">
                <div className="w-full">{children}</div>
            </section>

            <footer className="relative flex flex-col items-center pb-8 px-6">
                <div className="flex items-center gap-2 text-[var(--ink-mute)]">
                    <span className="h-px w-10 bg-[var(--card-border-strong)]" />
                    <span className="inline-block h-1 w-1 rotate-45 bg-[var(--saffron)]" />
                    <span className="font-mono text-[9px] tracking-widest uppercase">
                        24,800 seekers · 24 counsellors
                    </span>
                    <span className="inline-block h-1 w-1 rotate-45 bg-[var(--saffron)]" />
                    <span className="h-px w-10 bg-[var(--card-border-strong)]" />
                </div>
            </footer>
        </main>
    );
}

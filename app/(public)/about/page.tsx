import { getMetaTags } from "@/lib/seo";
import { LegalContent } from "@/components/LegalDialog";

export const metadata = getMetaTags({
    title: "About",
    canonicalUrlRelative: "/about",
});

export default function AboutPage() {
    return (
        <section className="px-6 py-8">
            <p className="eyebrow">Tara</p>
            <h1
                className="mt-1 font-display text-3xl text-[var(--ink)]"
                style={{ fontVariationSettings: '"opsz" 60, "SOFT" 30' }}
            >
                About Tara
            </h1>
            <div className="mt-6">
                <LegalContent kind="about" />
            </div>
            <p className="mt-10 text-[11px] tracking-widest uppercase text-[var(--ink-mute)] text-center">
                Last updated · May 2026
            </p>
        </section>
    );
}

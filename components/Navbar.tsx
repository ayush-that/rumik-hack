import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex items-center px-4 py-3 bg-[var(--paper)]/85 backdrop-blur-md border-b border-x border-[var(--card-border)] z-50">
            <Link href="/" className="flex items-center gap-2 text-[var(--ink)]">
                <Image
                    src="/logo.png"
                    alt="Tara"
                    width={28}
                    height={28}
                    priority
                    className="h-7 w-7 rounded-md object-contain"
                />
                <span
                    className="font-display text-xl"
                    style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
                >
                    tara
                </span>
            </Link>
        </header>
    );
}

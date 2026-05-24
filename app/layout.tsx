import type { Metadata } from "next";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getToken } from "@/lib/auth-server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserSync } from "@/components/UserSync";
import { cn } from "@/lib/utils";

// Display serif with optical sizing — gives headlines real character.
// next/font requires `weight` to be omitted (or set to "variable") when
// `axes` is provided; the full variable font ships all weights anyway.
const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-display",
    axes: ["opsz", "SOFT"],
    display: "swap",
});

// Body sans — soft geometric, pairs cleanly with Fraunces.
const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-sans",
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    weight: ["400", "500"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Tara — Talk to a counsellor",
    description:
        "Call verified astrology counsellors for guidance on marriage, health, wealth, legal, finance and career.",
};

export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const token = await getToken();
    return (
        <html
            lang="en"
            className={cn(
                "h-full antialiased",
                fraunces.variable,
                manrope.variable,
                jetbrainsMono.variable,
                "font-sans",
            )}
        >
            <body className="min-h-full flex flex-col bg-[var(--paper)] text-[var(--ink)]">
                <ConvexClientProvider initialToken={token}>
                    <UserSync />
                    {children}
                </ConvexClientProvider>
            </body>
        </html>
    );
}

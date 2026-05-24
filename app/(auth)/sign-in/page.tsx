"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Mail, Lock } from "lucide-react";

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const result = await authClient.signIn.email({
            email,
            password,
            callbackURL: "/dashboard",
        });

        setIsLoading(false);

        if (result.error) {
            setError(result.error.message || "Failed to sign in");
            return;
        }

        router.push("/dashboard");
    };

    return (
        <div className="space-y-6 ink-reveal">
            <div className="text-center">
                <h2
                    className="font-display text-[2rem] leading-tight text-[var(--ink)]"
                    style={{ fontVariationSettings: '"opsz" 80, "SOFT" 40' }}
                >
                    Welcome back.
                </h2>
                <p
                    className="mt-1 text-sm text-[var(--ink-faint)] italic"
                    style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 16' }}
                >
                    The stars have been waiting.
                </p>
            </div>

            {error && (
                <div className="rounded-xl bg-[var(--sindoor-wash)] px-4 py-3 border border-[var(--sindoor-soft)]/60">
                    <p className="text-sm text-[var(--sindoor)]">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                    <label
                        htmlFor="email"
                        className="eyebrow text-[var(--ink-faint)] block px-1"
                    >
                        Email
                    </label>
                    <div className="relative">
                        <Mail
                            size={16}
                            strokeWidth={1.6}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-mute)] pointer-events-none"
                        />
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@somewhere.com"
                            className="w-full rounded-xl border border-[var(--card-border-strong)] bg-[var(--vellum)] pl-11 pr-4 py-3.5 text-[var(--ink)] outline-none focus:border-[var(--saffron)] focus:bg-[var(--paper)] placeholder:text-[var(--ink-mute)]"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                        <label
                            htmlFor="password"
                            className="eyebrow text-[var(--ink-faint)]"
                        >
                            Password
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-[10px] text-[var(--saffron)] hover:underline underline-offset-2 tracking-wide"
                        >
                            Forgot?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock
                            size={16}
                            strokeWidth={1.6}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-mute)] pointer-events-none"
                        />
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-[var(--card-border-strong)] bg-[var(--vellum)] pl-11 pr-4 py-3.5 text-[var(--ink)] outline-none focus:border-[var(--saffron)] focus:bg-[var(--paper)] placeholder:text-[var(--ink-mute)]"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-saffron w-full mt-5"
                >
                    {isLoading ? "Opening the door…" : "Sign in"}
                    {!isLoading && <ArrowRight size={16} strokeWidth={2} />}
                </button>
            </form>

            <div className="flex items-center gap-3 text-[var(--ink-mute)]">
                <span className="h-px flex-1 bg-[var(--card-border-strong)]" />
                <span className="font-mono text-[9px] tracking-widest uppercase">or</span>
                <span className="h-px flex-1 bg-[var(--card-border-strong)]" />
            </div>

            <p className="text-center text-sm text-[var(--ink-soft)]">
                New to Tara?{" "}
                <Link
                    href="/sign-up"
                    className="font-semibold text-[var(--saffron)] hover:underline underline-offset-2 decoration-[var(--saffron-soft)]"
                >
                    Create your account
                </Link>
            </p>
        </div>
    );
}

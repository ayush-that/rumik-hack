"use client"

import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignInPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        const result = await authClient.signIn.email({
            email,
            password,
            callbackURL: "/dashboard",
        })

        setIsLoading(false)

        if (result.error) {
            setError(result.error.message || "Failed to sign in")
            return
        }

        router.push("/dashboard")
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Welcome back
                </h1>
                <p className="mt-1 text-sm text-zinc-600">
                    Sign in to your account to continue
                </p>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 p-3 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-white px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full cursor-pointer rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <p className="text-center text-sm text-zinc-600">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="font-semibold text-emerald-600">
                    Sign up
                </Link>
            </p>
        </div>
    )
}

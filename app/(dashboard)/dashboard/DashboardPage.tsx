"use client"
import { api } from "@/convex/_generated/api";
import { signOut } from "@/lib/auth-client";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import { Preloaded } from "convex/react";

export default function DashboardPage({ preloadedAuthQuery }: { preloadedAuthQuery: Preloaded<typeof api.auth.getCurrentUser> }) {
    const user = usePreloadedAuthQuery(preloadedAuthQuery)
    const loading = user == undefined

    return (
        <div className="h-screen text-muted w-full mx-auto flex items-center justify-center flex-col">
            <div className="font-bold py-10 text-5xl tracking-tight">
                Welcome, {loading ? "loading...." : user?.name}
            </div>
            <h1 className="text-balance text-center">
                This is your account info fetched from convex.
                <br />
                Edit this file in <span className="font-bold">app/(dashboard)/dashboard/page.tsx</span>
            </h1>
            <p className="w-1/3 break-all p-2 py-5 font-semibold tracking-tight text-center">
                Name : {loading ? "loading...." : user?.name}
                <br />
                Email : {loading ? "loading...." : user?.email}
            </p>

            <button
                onClick={async () => {
                    await signOut()
                }}
                className="absolute top-5 right-5 bg-zinc-300 p-2 rounded-md font-semibold tracking-tight text-black cursor-pointer">
                Logout
            </button>
        </div>
    )
}

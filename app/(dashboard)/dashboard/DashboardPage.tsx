"use client"
import { api } from "@/convex/_generated/api";
import { signOut } from "@/lib/auth-client";
import { usePreloadedAuthQuery } from "@convex-dev/better-auth/nextjs/client";
import { Preloaded, useAction } from "convex/react";
import Link from "next/link";
import { appConfig } from "@/lib/config";

export default function DashboardPage({ preloadedAuthQuery }: { preloadedAuthQuery: Preloaded<typeof api.auth.getCurrentUser> }) {
    const user = usePreloadedAuthQuery(preloadedAuthQuery)
    const loading = user == undefined

    const checkout = useAction(api.payments.createCheckout)
    const handleCheckout = async (product_id: string) => {
        const session = await checkout({
            product_cart: [
                { product_id: product_id, quantity: 1 }
            ],
        })
        if (session?.checkout_url) {
            window.location.href = session.checkout_url
        }
    }
    return (
        <div className="h-screen text-muted w-full mx-auto flex items-center justify-center flex-col">
            <div className="font-bold py-10 text-5xl tracking-tight">
                Welcome, {loading ? "loading...." : user?.name}
            </div>
            <h1 className="text-balance text-center">
                This is your account info fetched from convex, click on the buttons
                <br />
                below to test your payment provider checkout, edit this file in <span className="font-bold">app/(dashboard)/dashboard/page.tsx</span>
            </h1>
            <p className="w-1/3 break-all p-2 py-5 font-semibold tracking-tight">
                Name : {loading ? "loading...." : user?.name}
                <br />
                Email : {loading ? "loading...." : user?.email}
                <br />
                ImageUrl:<Link href={user?.image || "#"} target="_blank"> {loading ? "loading...." : user?.image} </Link>
            </p>
            <div className="flex gap-2">

                <button
                    onClick={async () => {
                        await signOut()
                    }}
                    className="absolute top-5 right-5 bg-zinc-300 p-2 rounded-md font-semibold tracking-tight text-black cursor-pointer">
                    Logout
                </button>

            </div>

            <h1 className="font-bold text-xl">These are the dodpayments products that you can test checkout for</h1>
            <p className="text-zinc-300 text-sm">
                Add your products to the <span className="font-bold">appConfig.dodoProductIds</span> array in <span className="font-bold">lib/config.ts</span> to enable checkout for your products.
                <br />
                see documentation for more details.
                <br />
                <br />
                <Link href="https://cyrux.in/docs/features/payments" target="_blank" className="text-zinc-300 underline text-sm">
                    Documentation
                </Link>
            </p>
            <div className="flex gap-2">
                {appConfig.dodoProductIds.map((p, i) => {
                    if (appConfig.dodoProductIds.length === 0) {
                        return null
                    }
                    return(
                        <button key={i} onClick={() => handleCheckout(p.id)} className="bg-zinc-300 p-2 rounded-md  font-semibold tracking-tight text-black cursor-pointer">
                            {p.name}
                        </button>
                    )
                })}
                {appConfig.dodoProductIds.length === 0 && (
                    <p className="text-zinc-300 text-sm">
                        No products found
                    </p>
                )}
            </div>
        </div>
    )
}
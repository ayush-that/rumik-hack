import Link from "next/link";
import { isAuthenticated } from "@/lib/auth-server";

export default async function LandingPage() {
    const authed = await isAuthenticated();
    return (
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-5xl font-bold tracking-tighter">Talk to a counsellor.</h1>
            <p className="mt-3 text-lg text-zinc-600 max-w-md">
                Marriage, health, wealth, legal, finance, career — get on a call with a verified astrologer in minutes.
            </p>
            <Link
                href={authed ? "/dashboard" : "/sign-up"}
                className="mt-8 inline-flex px-8 py-3 rounded-full bg-emerald-500 text-white font-semibold"
            >
                {authed ? "Browse counsellors" : "Get started"}
            </Link>
        </section>
    );
}

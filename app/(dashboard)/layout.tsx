import type { Metadata } from "next";
import "../globals.css";
import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ClientAuthBoundary } from "@/lib/auth-client";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = { title: "Dashboard", description: "Dashboard" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    if (!(await isAuthenticated())) redirect("/sign-in");
    return (
        <ClientAuthBoundary>
            <main className="mx-auto max-w-[480px] min-h-screen bg-[var(--background)] pb-20">
                {children}
            </main>
            <BottomNav />
        </ClientAuthBoundary>
    );
}

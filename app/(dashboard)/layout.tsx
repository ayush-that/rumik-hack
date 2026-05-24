import type { Metadata } from "next";
import "../globals.css";
import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ClientAuthBoundary } from "@/lib/auth-client";
import BottomNav from "@/components/BottomNav";
import DashboardHeader from "@/components/DashboardHeader";

export const metadata: Metadata = { title: "Dashboard", description: "Dashboard" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    if (!(await isAuthenticated())) redirect("/sign-in");
    return (
        <ClientAuthBoundary>
            <DashboardHeader />
            <main className="mx-auto w-full max-w-[480px] min-h-screen bg-[var(--background)] border-x border-[var(--card-border)] pt-16 pb-20">
                {children}
            </main>
            <BottomNav />
        </ClientAuthBoundary>
    );
}

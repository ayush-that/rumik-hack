import type { Metadata } from "next";
import "../globals.css";
import { getToken, isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ClientAuthBoundary } from "@/lib/auth-client";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Dashboard",
};

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
        redirect("/sign-in");
    }
    return (
        <ClientAuthBoundary>
            {children}
        </ClientAuthBoundary>
    )
}

import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";

export default async function AuthLayout({ children }: PropsWithChildren) {
    if (await isAuthenticated()) {
        redirect("/");
    }
    return <>{children}</>;
}

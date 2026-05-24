import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PropsWithChildren } from "react";
import Image from "next/image";

export default async function AuthLayout({ children }: PropsWithChildren) {
    if (await isAuthenticated()) {
        redirect("/");
    }
    return (
        <main className="mx-auto w-full max-w-[480px] min-h-screen bg-[var(--background)] border-x border-[var(--card-border)] flex flex-col">
            <div className="flex justify-center pt-10 pb-6">
                <Image src="/logo.png" alt="Cyrux" width={96} height={96} priority className="h-20 w-20 object-contain mix-blend-multiply" />
            </div>
            <div className="flex-1 px-6 pb-10">{children}</div>
        </main>
    );
}

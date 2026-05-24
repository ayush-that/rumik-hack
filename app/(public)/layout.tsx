import "../globals.css";
import MaxWidthWrapper from "@/components/MaxWdthWrapper";
import Navbar from "@/components/Navbar";
import { isAuthenticated } from "@/lib/auth-server";

export default async function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const isAuth = await isAuthenticated()
    return (
        <MaxWidthWrapper>
            <Navbar isAuth={isAuth} />
            {children}
        </MaxWidthWrapper>
    );
}

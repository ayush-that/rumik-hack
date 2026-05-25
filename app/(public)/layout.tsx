import "../globals.css";
import Navbar from "@/components/Navbar";

export default function PublicLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            <main className="mx-auto w-full max-w-[480px] min-h-screen bg-[var(--paper)] border-x border-[var(--card-border)] pt-[60px] relative">
                {children}
            </main>
        </>
    );
}

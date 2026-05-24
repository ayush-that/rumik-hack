import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { getToken } from "@/lib/auth-server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserSync } from "@/components/UserSync";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Tara — Talk to a counsellor',
  description: 'Call verified astrology counsellors for guidance on marriage, health, wealth, legal, finance and career.',
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider initialToken={token}>
          <UserSync />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}

import { getMetaTags } from "@/lib/seo";

export const metadata = getMetaTags({
    title: "About",
    canonicalUrlRelative: "/about",
})

export default function AboutPage() {
    return (
        <main>
            <h1>About</h1>
        </main>
    )
}
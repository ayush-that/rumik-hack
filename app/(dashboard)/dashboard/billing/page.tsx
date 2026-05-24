import Link from "next/link";

export default function BillingPage() {
    return (
        <div>
            <Link href={"/dashboard"}>
                dashboard
            </Link>
            billing
        </div>
    )
}
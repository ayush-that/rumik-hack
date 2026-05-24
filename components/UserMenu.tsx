import Link from "next/link";

export default function UserMenu({ initial }: { initial: string }) {
    return (
        <Link
            href="/dashboard/profile"
            aria-label="Profile"
            className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-700 font-semibold flex items-center justify-center"
        >
            {initial}
        </Link>
    );
}

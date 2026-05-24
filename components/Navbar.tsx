import Link from "next/link";

export default function Navbar({ isAuth }: { isAuth: boolean }) {
    return (
        <nav className="text-white flex justify-between w-full py-5 px-8 items-center">
            <Link href="/" className="flex items-center justify-center gap-2 font-bold tracking-tighter text-2xl">
     
                cyrux
            </Link>

            <ul className="flex gap-4 font-medium tracking-tight">
                <Link href="/about">
                    <li className="hover:underline">About</li>
                </Link>
                <Link href="/blog">
                    <li className="hover:underline">Blog</li>
                </Link>
            </ul>

            <button>
                {isAuth ? <Link className="bg-[#f8721c] group hover:bg-[#ed7e37] cursor-pointer tracking-tighter text-lg w-fit text-black font-medium flex gap-3 items-center justify-center px-4 py-2 rounded-md" href="/dashboard">Dashboard</Link> : <Link className="bg-[#f8721c] group hover:bg-[#ed7e37] cursor-pointer tracking-tighter text-lg w-fit text-black font-medium flex gap-3 items-center justify-center px-4 py-2 rounded-md" href="/sign-in">Sign In</Link>}
            </button>
        </nav>
    )
}
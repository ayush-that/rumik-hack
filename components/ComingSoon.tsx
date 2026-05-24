import type { ReactNode } from "react";

export default function ComingSoon({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-8">
            <div className="text-zinc-400 mb-3">{icon}</div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-zinc-500 mt-1">{message}</p>
            <p className="text-xs text-zinc-400 mt-6">Coming soon.</p>
        </div>
    );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

function formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(sec?: number): string {
    if (!sec || sec <= 0) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await fetchAuthQuery(api.calls.getMine, {
        callId: id as Id<"calls">,
    }).catch(() => null);
    if (!data) notFound();
    const { call, turns } = data;

    return (
        <div className="px-4 pt-3">
            <Link href="/dashboard/call" className="inline-flex items-center gap-1 text-sm text-zinc-600 mb-3">
                <ArrowLeft size={16} /> Back
            </Link>

            <div className="flex flex-col items-center text-center">
                <Image
                    src={call.counsellorPortrait}
                    alt={call.counsellorName}
                    width={96}
                    height={96}
                    className="rounded-full object-cover h-24 w-24"
                />
                <h1 className="mt-3 text-xl font-bold">{call.counsellorName}</h1>
                <p className="text-sm text-zinc-500">{formatDate(call.startedAt)}</p>
                <p className="text-sm text-zinc-500 mt-1">
                    Duration: <span className="font-medium text-zinc-700">{formatDuration(call.durationSec)}</span>
                </p>

                <Link
                    href={`/dashboard/call/${call.counsellorSlug}`}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold"
                >
                    <Phone size={16} /> Call again
                </Link>
            </div>

            <div className="mt-6">
                <h2 className="text-sm font-semibold text-zinc-600 mb-2">Transcript</h2>
                {turns.length === 0 ? (
                    <p className="text-sm text-zinc-400 text-center py-6">No transcript captured.</p>
                ) : (
                    <div className="space-y-2 pb-6">
                        {turns.map((t) => (
                            <div
                                key={t._id}
                                className={
                                    t.role === "user"
                                        ? "bg-zinc-100 rounded-2xl rounded-br-sm px-4 py-2 text-sm text-zinc-700 ml-auto max-w-[92%] text-left w-fit"
                                        : "bg-emerald-50 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-emerald-900 max-w-[92%] text-left w-fit"
                                }
                            >
                                {t.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

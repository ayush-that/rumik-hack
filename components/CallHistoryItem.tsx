import Image from "next/image";
import Link from "next/link";
import { Phone, PhoneOutgoing } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    if (sameDay) return `Today, ${hh}:${mm}`;
    if (isYesterday) return `Yesterday, ${hh}:${mm}`;
    return `${d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}, ${hh}:${mm}`;
}

function formatDuration(sec?: number): string | null {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
}

export default function CallHistoryItem({ call }: { call: Doc<"calls"> }) {
    const duration = formatDuration(call.durationSec);
    return (
        <div className="flex items-center px-4 py-3 active:bg-zinc-50">
            <Link
                href={`/dashboard/call/history/${call._id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
            >
                <Image
                    src={call.counsellorPortrait}
                    alt={call.counsellorName}
                    width={48}
                    height={48}
                    className="rounded-full object-cover h-12 w-12 shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{call.counsellorName}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <PhoneOutgoing size={12} className="text-emerald-500" />
                        {formatTime(call.startedAt)}
                        {duration && <span className="text-zinc-400">· {duration}</span>}
                    </p>
                </div>
            </Link>
            <Link
                href={`/dashboard/call/${call.counsellorSlug}`}
                className="shrink-0 p-2 text-emerald-600"
                aria-label={`Call ${call.counsellorName} again`}
            >
                <Phone size={20} />
            </Link>
        </div>
    );
}

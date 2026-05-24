"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { MessageCirclePlus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { ChatCounsellor } from "@/components/AiChatClient";

type SessionRow = {
    counsellor: ChatCounsellor;
    lastMessage: string;
    lastRole: "user" | "assistant";
    lastAt: number;
    messageCount: number;
};

function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export default function ChatInbox({ counsellors }: { counsellors: ChatCounsellor[] }) {
    const sessions = useQuery(api.chat.listSessions);
    const [query, setQuery] = useState("");

    const bySlug = useMemo(() => {
        const m = new Map<string, ChatCounsellor>();
        for (const c of counsellors) m.set(c.slug, c);
        return m;
    }, [counsellors]);

    const rows: SessionRow[] = useMemo(() => {
        if (!sessions) return [];
        const out: SessionRow[] = [];
        for (const s of sessions) {
            const counsellor = bySlug.get(s.counsellorSlug);
            if (!counsellor) continue;
            out.push({
                counsellor,
                lastMessage: s.lastMessage,
                lastRole: s.lastRole,
                lastAt: s.lastAt,
                messageCount: s.messageCount,
            });
        }
        return out;
    }, [sessions, bySlug]);

    const needle = query.trim().toLowerCase();
    const filteredRows = needle
        ? rows.filter((r) => r.counsellor.name.toLowerCase().includes(needle))
        : rows;
    const filteredCounsellors = needle
        ? counsellors.filter((c) => c.name.toLowerCase().includes(needle))
        : counsellors;

    return (
        <div className="pb-8">
            <div className="sticky top-16 z-30 bg-[var(--background)] border-b border-[var(--card-border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <h1 className="text-lg font-semibold">Chats</h1>
                    <span className="text-xs text-zinc-500">{rows.length} conversations</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white border border-[var(--card-border)] px-3 py-2">
                    <Search size={14} className="text-zinc-500 shrink-0" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search counsellors"
                        className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                </div>
            </div>

            {sessions === undefined ? (
                <p className="text-sm text-zinc-500 text-center mt-12">Loading…</p>
            ) : rows.length === 0 ? (
                <NewChatList counsellors={filteredCounsellors} empty />
            ) : (
                <>
                    <ul className="divide-y divide-[var(--card-border)]">
                        {filteredRows.map((r) => (
                            <li key={r.counsellor.slug}>
                                <Link
                                    href={`/dashboard/chat?counsellor=${r.counsellor.slug}`}
                                    className="flex items-center gap-3 px-4 py-3 active:bg-zinc-50"
                                >
                                    <Image
                                        src={r.counsellor.portrait}
                                        alt={r.counsellor.name}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover h-12 w-12 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="font-medium truncate">{r.counsellor.name}</p>
                                            <span className="text-[11px] text-zinc-400 shrink-0">{formatTime(r.lastAt)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500 truncate">
                                            {r.lastRole === "user" ? "You: " : ""}{r.lastMessage}
                                        </p>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="px-4 mt-6">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500">
                            <MessageCirclePlus size={14} />
                            <span>Start a new chat</span>
                        </div>
                        <NewChatList
                            counsellors={filteredCounsellors.filter((c) => !rows.some((r) => r.counsellor.slug === c.slug))}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function NewChatList({ counsellors, empty = false }: { counsellors: ChatCounsellor[]; empty?: boolean }) {
    if (counsellors.length === 0) {
        return empty ? (
            <p className="text-sm text-zinc-500 text-center mt-12 px-8">No counsellors match.</p>
        ) : null;
    }
    return (
        <ul className={`${empty ? "mt-4" : "mt-2"} divide-y divide-[var(--card-border)]`}>
            {counsellors.map((c) => (
                <li key={c.slug}>
                    <Link
                        href={`/dashboard/chat?counsellor=${c.slug}`}
                        className="flex items-center gap-3 px-4 py-3 active:bg-zinc-50"
                    >
                        <Image
                            src={c.portrait}
                            alt={c.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover h-10 w-10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{c.specialties.join(" · ")}</p>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

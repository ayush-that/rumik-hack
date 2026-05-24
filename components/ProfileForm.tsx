"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

interface Props {
    email: string;
    initial: {
        displayName: string;
        gender: "male" | "female" | null;
        birthDate: string | null;
        birthTime: string | null;
        birthTimeUnknown: boolean;
        birthPlace: string | null;
    };
}

export default function ProfileForm({ email, initial }: Props) {
    const router = useRouter();
    const saveProfile = useMutation(api.user.saveProfile);

    const [name, setName] = useState(initial.displayName);
    const [gender, setGender] = useState<"male" | "female" | null>(initial.gender);
    const [birthDate, setBirthDate] = useState(initial.birthDate ?? "");
    const [birthTime, setBirthTime] = useState(initial.birthTime ?? "");
    const [birthTimeUnknown, setBirthTimeUnknown] = useState(initial.birthTimeUnknown);
    const [birthPlace, setBirthPlace] = useState(initial.birthPlace ?? "");
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const valid =
        name.trim().length > 0 &&
        gender !== null &&
        birthDate.length > 0 &&
        (birthTimeUnknown || birthTime.length > 0) &&
        birthPlace.trim().length > 0;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!valid || saving) return;
        setError(null);
        setSaving(true);
        try {
            await saveProfile({
                displayName: name.trim(),
                gender: gender!,
                birthDate,
                birthTime: birthTimeUnknown ? undefined : birthTime,
                birthTimeUnknown,
                birthPlace: birthPlace.trim(),
            });
            setSavedAt(Date.now());
            router.refresh();
        } catch (err) {
            console.error("saveProfile failed", err);
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="px-5 pt-3 pb-8">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard" className="text-zinc-700" aria-label="Back">
                    <ArrowLeft size={22} />
                </Link>
                <h1 className="text-lg font-semibold text-zinc-800">Profile</h1>
            </div>

            <div className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</label>
                    <div className="w-full rounded-xl bg-zinc-100 border border-[var(--card-border)] px-4 py-3 text-zinc-700">
                        {email}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</label>
                    <input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl bg-white border border-[var(--card-border)] px-4 py-3 text-zinc-900 outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>

                <div className="space-y-1.5">
                    <span className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Gender</span>
                    <div className="grid grid-cols-2 gap-3">
                        {(["male", "female"] as const).map((g) => {
                            const selected = gender === g;
                            return (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGender(g)}
                                    className={`py-3 rounded-xl border text-sm font-medium capitalize transition-colors ${
                                        selected
                                            ? "bg-yellow-400 border-yellow-400 text-zinc-900"
                                            : "bg-white border-[var(--card-border)] text-zinc-700"
                                    }`}
                                >
                                    {g}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="birthDate" className="text-xs font-medium uppercase tracking-wide text-zinc-500">Birth date</label>
                    <input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        className="w-full rounded-xl bg-white border border-[var(--card-border)] px-4 py-3 text-zinc-900 outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="birthTime" className="text-xs font-medium uppercase tracking-wide text-zinc-500">Birth time</label>
                    <input
                        id="birthTime"
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        disabled={birthTimeUnknown}
                        className="w-full rounded-xl bg-white border border-[var(--card-border)] px-4 py-3 text-zinc-900 outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                    />
                    <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
                        <input
                            type="checkbox"
                            checked={birthTimeUnknown}
                            onChange={(e) => setBirthTimeUnknown(e.target.checked)}
                            className="h-4 w-4 accent-yellow-500"
                        />
                        Don&apos;t know my exact time of birth
                    </label>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="birthPlace" className="text-xs font-medium uppercase tracking-wide text-zinc-500">Birth place</label>
                    <input
                        id="birthPlace"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder="City, State, Country"
                        className="w-full rounded-xl bg-white border border-[var(--card-border)] px-4 py-3 text-zinc-900 outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={!valid || saving}
                className="mt-8 w-full py-3.5 rounded-full bg-yellow-400 text-zinc-900 font-semibold text-base disabled:opacity-50 active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
            >
                {saving ? "Saving…" : savedAt ? (<><Check size={18} /> Saved</>) : "Save changes"}
            </button>
        </form>
    );
}

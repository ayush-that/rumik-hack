"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ArrowLeft, User, Venus, Calendar, Clock, MapPin } from "lucide-react";
import { api } from "@/convex/_generated/api";

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_ICONS = [User, Venus, Calendar, Clock, MapPin];

interface Props {
    counsellorName: string;
    initialName?: string;
    action?: "chat" | "call";
    onDone: () => void;
}

export default function OnboardingForm({ counsellorName, initialName, action = "chat", onDone }: Props) {
    const saveProfile = useMutation(api.user.saveProfile);

    const [step, setStep] = useState<Step>(0);
    const [name, setName] = useState(initialName ?? "");
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
    const [birthTime, setBirthTime] = useState(""); // HH:MM
    const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
    const [birthPlace, setBirthPlace] = useState("");
    const [saving, setSaving] = useState(false);

    const canAdvance =
        (step === 0 && name.trim().length > 0) ||
        (step === 1 && gender !== null) ||
        (step === 2 && !!birthDate) ||
        (step === 3 && (birthTimeUnknown || !!birthTime)) ||
        (step === 4 && birthPlace.trim().length > 0);

    const goBack = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
    const goNext = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));

    const handleFinish = async () => {
        if (!canAdvance || saving) return;
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
            onDone();
        } catch (e) {
            console.error("saveProfile failed", e);
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-9rem)] px-5 pt-3 pb-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 0}
                    className="text-zinc-700 disabled:opacity-30"
                    aria-label="Back"
                >
                    <ArrowLeft size={22} />
                </button>
                <h1 className="text-lg font-semibold text-zinc-800">Enter Your Details</h1>
            </div>

            <div className="flex items-center gap-3 mb-10">
                {STEP_ICONS.map((Icon, i) => {
                    const active = i === step;
                    const done = i < step;
                    return (
                        <div
                            key={i}
                            className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                                done
                                    ? "bg-yellow-400"
                                    : active
                                      ? "bg-yellow-400 ring-2 ring-yellow-500"
                                      : "bg-zinc-300"
                            }`}
                        >
                            {active && <Icon size={14} className="text-zinc-800" />}
                        </div>
                    );
                })}
            </div>

            <div className="flex-1">
                {step === 0 && (
                    <div>
                        <h2 className="text-2xl font-semibold text-zinc-700 leading-tight">
                            Hey there!<br />What is your name?
                        </h2>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="mt-8 w-full bg-white rounded-xl px-4 py-3.5 text-base outline-none border border-transparent focus:border-yellow-400"
                            autoFocus
                        />
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <h2 className="text-2xl font-semibold text-zinc-700">What is your gender?</h2>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {(["male", "female"] as const).map((g) => {
                                const Icon = g === "male" ? User : Venus;
                                const selected = gender === g;
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGender(g)}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        <span
                                            className={`h-24 w-24 rounded-full flex items-center justify-center border-2 transition-colors ${
                                                selected
                                                    ? "bg-yellow-400 border-yellow-400"
                                                    : "bg-white border-yellow-400"
                                            }`}
                                        >
                                            <Icon size={42} className="text-zinc-800" strokeWidth={1.5} />
                                        </span>
                                        <span className="text-lg text-zinc-800 capitalize">{g}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-semibold text-zinc-700">Enter your birth date</h2>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            max={new Date().toISOString().slice(0, 10)}
                            className="mt-8 w-full bg-white rounded-xl px-4 py-3.5 text-base outline-none border border-transparent focus:border-yellow-400"
                        />
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h2 className="text-2xl font-semibold text-zinc-700">Enter your birth time</h2>
                        <input
                            type="time"
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            disabled={birthTimeUnknown}
                            className="mt-8 w-full bg-white rounded-xl px-4 py-3.5 text-base outline-none border border-transparent focus:border-yellow-400 disabled:opacity-50"
                        />
                        <label className="mt-5 flex items-center gap-2 text-zinc-700">
                            <input
                                type="checkbox"
                                checked={birthTimeUnknown}
                                onChange={(e) => setBirthTimeUnknown(e.target.checked)}
                                className="h-5 w-5 accent-yellow-500"
                            />
                            <span>Don&apos;t know my exact time of birth</span>
                        </label>
                        <p className="mt-2 text-sm text-zinc-500">
                            Note: Without time of birth, we can still achieve upto 80% accurate predictions
                        </p>
                    </div>
                )}

                {step === 4 && (
                    <div>
                        <h2 className="text-2xl font-semibold text-zinc-700">Where were you born?</h2>
                        <input
                            value={birthPlace}
                            onChange={(e) => setBirthPlace(e.target.value)}
                            placeholder="City, State, Country"
                            className="mt-8 w-full bg-white rounded-xl px-4 py-3.5 text-base outline-none border border-transparent focus:border-yellow-400"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={step === 4 ? handleFinish : goNext}
                disabled={!canAdvance || saving}
                className="mt-6 w-full py-3.5 rounded-full bg-yellow-400 text-zinc-900 font-semibold text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
            >
                {step === 4 ? (saving ? "Saving…" : `Start ${action} with ${counsellorName}`) : "Next"}
            </button>
        </div>
    );
}

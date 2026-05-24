"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { ArrowLeft, User, Venus, Calendar, Clock, MapPin, Camera, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEP_ICONS = [Camera, User, Venus, Calendar, Clock, MapPin];

interface Props {
    counsellorName: string;
    initialName?: string;
    onDone: () => void;
}

export default function OnboardingForm({ counsellorName, initialName, onDone }: Props) {
    const saveProfile = useMutation(api.user.saveProfile);
    const generateUploadUrl = useMutation(api.user.generateProfileUploadUrl);

    const [step, setStep] = useState<Step>(0);
    const [name, setName] = useState(initialName ?? "");
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [birthDate, setBirthDate] = useState(""); // YYYY-MM-DD
    const [birthTime, setBirthTime] = useState(""); // HH:MM
    const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
    const [birthPlace, setBirthPlace] = useState("");
    const [imageStorageId, setImageStorageId] = useState<Id<"_storage"> | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const canAdvance =
        // photo step is optional — always advance-able
        step === 0 ||
        (step === 1 && name.trim().length > 0) ||
        (step === 2 && gender !== null) ||
        (step === 3 && !!birthDate) ||
        (step === 4 && (birthTimeUnknown || !!birthTime)) ||
        (step === 5 && birthPlace.trim().length > 0);

    const goBack = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
    const goNext = () => setStep((s) => (s < 5 ? ((s + 1) as Step) : s));

    const handlePickFile = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-picking the same file later
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setUploadError("Pick an image file");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            setUploadError("Image must be under 8 MB");
            return;
        }
        setUploadError(null);
        setUploading(true);
        const localUrl = URL.createObjectURL(file);
        setImagePreview(localUrl);
        try {
            const uploadUrl = await generateUploadUrl();
            const res = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!res.ok) throw new Error(`upload failed: ${res.status}`);
            const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
            setImageStorageId(storageId);
        } catch (err) {
            console.error("profile image upload failed", err);
            setUploadError("Upload failed. Try again.");
            setImagePreview(null);
            setImageStorageId(null);
        } finally {
            setUploading(false);
        }
    };

    const handleFinish = async () => {
        if (!canAdvance || saving || uploading) return;
        setSaving(true);
        try {
            await saveProfile({
                displayName: name.trim(),
                gender: gender!,
                birthDate,
                birthTime: birthTimeUnknown ? undefined : birthTime,
                birthTimeUnknown,
                birthPlace: birthPlace.trim(),
                profileImageStorageId: imageStorageId ?? undefined,
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
                            Add a profile photo
                        </h2>
                        <p className="mt-2 text-sm text-zinc-500">
                            Optional — helps your counsellor personalise the reading.
                        </p>

                        <div className="mt-10 flex flex-col items-center">
                            <button
                                type="button"
                                onClick={handlePickFile}
                                disabled={uploading}
                                className="relative h-36 w-36 rounded-full bg-white border-2 border-yellow-400 overflow-hidden flex items-center justify-center text-zinc-500 active:scale-[0.99] transition-transform disabled:opacity-70"
                            >
                                {imagePreview ? (
                                    <Image
                                        src={imagePreview}
                                        alt="Profile preview"
                                        fill
                                        unoptimized
                                        sizes="144px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <Camera size={44} strokeWidth={1.5} />
                                )}
                                {uploading && (
                                    <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <Loader2 size={28} className="animate-spin text-white" />
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handlePickFile}
                                disabled={uploading}
                                className="mt-4 text-sm font-medium text-yellow-700 underline-offset-2 hover:underline disabled:opacity-50"
                            >
                                {imagePreview ? "Change photo" : "Choose photo"}
                            </button>
                            {uploadError && (
                                <p className="mt-2 text-sm text-red-500">{uploadError}</p>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                )}

                {step === 1 && (
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

                {step === 2 && (
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

                {step === 3 && (
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

                {step === 4 && (
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

                {step === 5 && (
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
                onClick={step === 5 ? handleFinish : goNext}
                disabled={!canAdvance || saving || uploading}
                className="mt-6 w-full py-3.5 rounded-full bg-yellow-400 text-zinc-900 font-semibold text-base disabled:opacity-50 active:scale-[0.99] transition-transform"
            >
                {step === 5
                    ? saving
                        ? "Saving…"
                        : `Start chat with ${counsellorName}`
                    : step === 0 && !imagePreview
                      ? "Skip"
                      : "Next"}
            </button>
        </div>
    );
}

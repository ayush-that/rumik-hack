"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import {
    ArrowLeft,
    Camera,
    Loader2,
    UserRound,
    VenusAndMars,
    Calendar,
    Clock,
    MapPin,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Sigil from "./Sigil";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const STEPS = [
    { icon: Camera,         label: "Image",  eyebrow: "I" },
    { icon: UserRound,      label: "Name",   eyebrow: "II" },
    { icon: VenusAndMars,   label: "Gender", eyebrow: "III" },
    { icon: Calendar,       label: "Date",   eyebrow: "IV" },
    { icon: Clock,          label: "Time",   eyebrow: "V" },
    { icon: MapPin,         label: "Place",  eyebrow: "VI" },
];

interface Props {
    counsellorName: string;
    initialName?: string;
    action?: "chat" | "call";
    onDone: () => void;
}

export default function OnboardingForm({
    counsellorName,
    initialName,
    action = "chat",
    onDone,
}: Props) {
    const saveProfile = useMutation(api.user.saveProfile);
    const generateUploadUrl = useMutation(api.user.generateProfileUploadUrl);

    const [step, setStep] = useState<Step>(0);
    const [name, setName] = useState(initialName ?? "");
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [birthDate, setBirthDate] = useState("");
    const [birthTime, setBirthTime] = useState("");
    const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
    const [birthPlace, setBirthPlace] = useState("");
    const [imageStorageId, setImageStorageId] = useState<Id<"_storage"> | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const canAdvance =
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
        e.target.value = "";
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

    const currentStep = STEPS[step];

    return (
        <div className="relative min-h-[calc(100vh-9rem)] px-6 pt-2 pb-8 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
                <button
                    type="button"
                    onClick={goBack}
                    disabled={step === 0}
                    className="text-[var(--ink-soft)] disabled:opacity-30 hover:text-[var(--saffron)] transition-colors"
                    aria-label="Back"
                >
                    <ArrowLeft size={20} strokeWidth={1.7} />
                </button>
                <span className="eyebrow text-[var(--ink-faint)]">Your kundali, in brief</span>
                <span className="ml-auto font-mono text-[10px] tracking-widest text-[var(--ink-mute)] nums">
                    {String(step + 1).padStart(2, "0")}/06
                </span>
            </div>

            <div className="relative mb-8">
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-px bg-[var(--card-border-strong)]" />
                <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-px bg-[var(--saffron)] transition-[width] duration-500"
                    style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - ${(step / (STEPS.length - 1)) * 24}px)` }}
                />
                <ol className="relative flex justify-between items-center">
                    {STEPS.map(({ icon: Icon }, i) => {
                        const active = i === step;
                        const done = i < step;
                        return (
                            <li key={i}>
                                <div
                                    className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all ${
                                        done
                                            ? "bg-[var(--saffron)] border-[var(--saffron)] text-[var(--paper)]"
                                            : active
                                              ? "bg-[var(--vellum)] border-[var(--saffron)] text-[var(--saffron)] ring-2 ring-[var(--saffron-wash)]"
                                              : "bg-[var(--vellum)] border-[var(--card-border-strong)] text-[var(--ink-mute)]"
                                    }`}
                                >
                                    <Icon size={12} strokeWidth={1.8} />
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] tracking-widest text-[var(--saffron)]">
                        STEP {currentStep.eyebrow}
                    </span>
                    <span className="h-px w-8 bg-[var(--card-border-strong)]" />
                    <span className="eyebrow text-[var(--ink-mute)]">{currentStep.label}</span>
                </div>

                {step === 0 && (
                    <div className="ink-reveal">
                        <h2
                            className="font-display text-[2rem] leading-[1.05] text-[var(--ink)]"
                            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
                        >
                            A face for the chart.
                        </h2>
                        <p className="mt-2 text-sm text-[var(--ink-faint)] max-w-[280px]">
                            Optional — but the counsellor likes to see who they&rsquo;re reading for. You can skip this.
                        </p>

                        <div className="mt-10 flex flex-col items-center">
                            <button
                                type="button"
                                onClick={handlePickFile}
                                disabled={uploading}
                                className="relative h-40 w-40 group active:scale-[0.99] transition-transform disabled:opacity-70"
                            >
                                <div className="absolute inset-0 text-[var(--saffron)] opacity-25 group-hover:opacity-40 transition-opacity">
                                    <Sigil size={160} weight={0.8} spin />
                                </div>
                                <div className="absolute inset-2 rounded-full bg-[var(--vellum)] border border-[var(--card-border-strong)] overflow-hidden flex items-center justify-center text-[var(--ink-mute)]">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Profile preview"
                                            fill
                                            unoptimized
                                            sizes="160px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Camera size={36} strokeWidth={1.3} />
                                    )}
                                    {uploading && (
                                        <span className="absolute inset-0 bg-[var(--ink)]/40 flex items-center justify-center">
                                            <Loader2 size={26} className="animate-spin text-[var(--paper)]" />
                                        </span>
                                    )}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={handlePickFile}
                                disabled={uploading}
                                className="mt-5 text-sm font-medium text-[var(--saffron)] underline underline-offset-4 decoration-[var(--saffron-soft)] disabled:opacity-50"
                            >
                                {imagePreview ? "Replace photo" : "Choose photo"}
                            </button>
                            {uploadError && (
                                <p className="mt-2 text-xs text-[var(--sindoor)]">{uploadError}</p>
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
                    <div className="ink-reveal">
                        <h2
                            className="font-display text-[2rem] leading-[1.05] text-[var(--ink)]"
                            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
                        >
                            What shall we call you?
                        </h2>
                        <p className="mt-2 text-sm text-[var(--ink-faint)]">
                            Your full name, as your mother would say it.
                        </p>
                        <div className="mt-8 relative">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                autoFocus
                                className="w-full bg-[var(--vellum)] rounded-xl px-4 py-4 font-display text-xl text-[var(--ink)] outline-none border border-[var(--card-border-strong)] focus:border-[var(--saffron)] focus:bg-[var(--paper)] placeholder:text-[var(--ink-mute)] placeholder:italic"
                                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 60' }}
                            />
                            <span className="absolute -bottom-1.5 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--saffron-soft)] to-transparent opacity-0 transition-opacity peer-focus:opacity-100" />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="ink-reveal">
                        <h2
                            className="font-display text-[2rem] leading-[1.05] text-[var(--ink)]"
                            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
                        >
                            And your janma raashi?
                        </h2>
                        <p className="mt-2 text-sm text-[var(--ink-faint)]">
                            Helps us match the right voice and tradition.
                        </p>
                        <div className="mt-10 grid grid-cols-2 gap-4">
                            {(["male", "female"] as const).map((g) => {
                                const selected = gender === g;
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGender(g)}
                                        className={`relative card-paper py-6 flex flex-col items-center gap-2 transition-all ${
                                            selected
                                                ? "border-[var(--saffron)] bg-[var(--saffron-wash)]"
                                                : "hover:border-[var(--saffron-soft)]"
                                        }`}
                                    >
                                        {selected && (
                                            <span className="absolute top-2 right-2 h-1.5 w-1.5 rotate-45 bg-[var(--saffron)]" />
                                        )}
                                        <div
                                            className={`h-16 w-16 rounded-full flex items-center justify-center border-2 ${
                                                selected
                                                    ? "border-[var(--saffron)] bg-[var(--paper)]"
                                                    : "border-[var(--card-border-strong)] bg-[var(--paper)]"
                                            }`}
                                        >
                                            <span
                                                className="font-display text-2xl text-[var(--ink)]"
                                                style={{ fontVariationSettings: '"opsz" 60' }}
                                            >
                                                {g === "male" ? "♂" : "♀"}
                                            </span>
                                        </div>
                                        <span
                                            className="font-display text-lg text-[var(--ink)] capitalize"
                                            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 60' }}
                                        >
                                            {g}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="ink-reveal">
                        <h2
                            className="font-display text-[2rem] leading-[1.05] text-[var(--ink)]"
                            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
                        >
                            The day you arrived.
                        </h2>
                        <p className="mt-2 text-sm text-[var(--ink-faint)]">
                            Tithi, nakshatra, all flows from this.
                        </p>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            max={new Date().toISOString().slice(0, 10)}
                            className="mt-8 w-full bg-[var(--vellum)] rounded-xl px-4 py-4 outline-none border border-[var(--card-border-strong)] focus:border-[var(--saffron)]"
                        />
                    </div>
                )}

                {step === 4 && (
                    <div className="ink-reveal">
                        <h2
                            className="font-display text-[2rem] leading-[1.05] text-[var(--ink)]"
                            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
                        >
                            The hour, if you know it.
                        </h2>
                        <p className="mt-2 text-sm text-[var(--ink-faint)]">
                            For the lagna — the rising sign.
                        </p>
                        <input
                            type="time"
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            disabled={birthTimeUnknown}
                            className="mt-8 w-full bg-[var(--vellum)] rounded-xl px-4 py-4 outline-none border border-[var(--card-border-strong)] focus:border-[var(--saffron)] disabled:opacity-50 disabled:bg-[var(--paper-deep)]"
                        />
                        <label className="mt-5 flex items-center gap-3 text-[var(--ink-soft)] cursor-pointer">
                            <input
                                type="checkbox"
                                checked={birthTimeUnknown}
                                onChange={(e) => setBirthTimeUnknown(e.target.checked)}
                                className="h-4 w-4 accent-[var(--saffron)]"
                            />
                            <span className="text-sm">I don&rsquo;t know the exact time</span>
                        </label>
                        <p className="mt-3 text-xs text-[var(--ink-faint)] italic max-w-[300px]" style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 12' }}>
                            Without it the reading stays roughly 80% accurate — the moon and houses simply move with the day instead.
                        </p>
                    </div>
                )}

                {step === 5 && (
                    <div className="ink-reveal">
                        <h2
                            className="font-display text-[2rem] leading-[1.05] text-[var(--ink)]"
                            style={{ fontVariationSettings: '"opsz" 60, "SOFT" 50' }}
                        >
                            And where on the map?
                        </h2>
                        <p className="mt-2 text-sm text-[var(--ink-faint)]">
                            The city you were born in — lat/long matters.
                        </p>
                        <input
                            value={birthPlace}
                            onChange={(e) => setBirthPlace(e.target.value)}
                            placeholder="City, State, Country"
                            autoFocus
                            className="mt-8 w-full bg-[var(--vellum)] rounded-xl px-4 py-4 font-display text-lg text-[var(--ink)] outline-none border border-[var(--card-border-strong)] focus:border-[var(--saffron)] placeholder:text-[var(--ink-mute)] placeholder:italic placeholder:font-normal"
                            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 50' }}
                        />
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={step === 5 ? handleFinish : goNext}
                disabled={!canAdvance || saving || uploading}
                className={step === 5 ? "btn-saffron mt-6 w-full" : "btn-saffron mt-6 w-full"}
            >
                {step === 5
                    ? saving
                        ? "Connecting…"
                        : `Begin ${action} with ${counsellorName.split(" ")[0]}`
                    : step === 0 && !imagePreview
                      ? "Skip for now"
                      : "Continue"}
            </button>
        </div>
    );
}

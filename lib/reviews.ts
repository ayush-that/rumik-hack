// Deterministic per-counsellor review generator. Stable across reloads,
// varied per slug. Pure derivation — no DB.

export type Review = {
    name: string;
    rating: number; // 1..5, in 0.5 increments
    text: string;
    daysAgo: number;
};

const REVIEWERS = [
    "Aarav", "Ananya", "Ishaan", "Diya", "Vivaan", "Saanvi", "Reyansh", "Aadhya",
    "Krishna", "Pari", "Arjun", "Myra", "Vihaan", "Anika", "Aditya", "Riya",
    "Kabir", "Sneha", "Rohan M.", "Tara", "Yash", "Meera", "Karan", "Nisha",
    "Devansh", "Pooja", "Aryan", "Ritika", "Siddharth", "Kavya",
];

const TEMPLATES_HIGH = [
    "{name}-ji ne meri marriage problems solve kar di. Sach mein helpful guidance.",
    "Bahut accurate predictions. Got clarity on career within 10 mins.",
    "Calm voice and to-the-point advice. Highly recommend.",
    "Family situation samjha diya properly. Felt heard for the first time.",
    "Predicted my job change exactly. Trust bann gaya.",
    "Genuine person. Didn't push expensive remedies, just clear answers.",
    "Solid Vedic knowledge. Explained my chart in simple Hinglish.",
    "Honestly the best call I've had on this app. Worth every rupee.",
    "Diya remedies actually work. 3 weeks baad situation improve hua.",
];

const TEMPLATES_MID = [
    "Decent reading. Some things matched, some didn't.",
    "Helpful but the call felt a bit rushed.",
    "Good advice for finance. Marriage part was generic though.",
    "Knows the basics well, expected slightly deeper analysis.",
    "Polite and patient. Predictions thoda vague the.",
    "Okay-okay. Will try again maybe.",
];

const TEMPLATES_LOW = [
    "Could be more specific with predictions.",
    "Not sure if I got my money's worth.",
    "Generic advice. Expected more depth.",
    "Connection was patchy and call ended abruptly.",
];

// Fast deterministic 32-bit hash (xmur3-ish).
function hash(str: string): number {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return (h ^ (h >>> 16)) >>> 0;
}

function rng(seed: number) {
    let s = seed || 1;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

function pick<T>(arr: T[], r: () => number, taken: Set<number>): T {
    let i = Math.floor(r() * arr.length);
    while (taken.has(i)) i = (i + 1) % arr.length;
    taken.add(i);
    return arr[i];
}

function roundHalf(n: number) {
    return Math.round(n * 2) / 2;
}

export function generateReviews(slug: string, baseRating: number, count = 5): Review[] {
    const r = rng(hash(slug));
    const names = new Set<number>();
    const out: Review[] = [];

    for (let i = 0; i < count; i++) {
        // jitter rating around base by ±0.7, clamp 1..5, half-step
        const jitter = (r() - 0.5) * 1.4;
        const rating = Math.max(1, Math.min(5, roundHalf(baseRating + jitter)));

        const pool = rating >= 4.5 ? TEMPLATES_HIGH
            : rating >= 3.5 ? TEMPLATES_MID
                : TEMPLATES_LOW;

        const name = pick(REVIEWERS, r, names);
        const tpl = pool[Math.floor(r() * pool.length)];
        const text = tpl.replace("{name}", name.split(" ")[0]);

        // 2..240 days ago, weighted towards recent
        const daysAgo = Math.floor(Math.pow(r(), 2) * 240) + 2;

        out.push({ name, rating, text, daysAgo });
    }

    return out.sort((a, b) => a.daysAgo - b.daysAgo);
}

export function formatRelativeDays(days: number): string {
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

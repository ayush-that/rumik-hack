import { Star } from "lucide-react";

export default function RatingStars({ rating, size = 12 }: { rating: number; size?: number }) {
    const pct = Math.max(0, Math.min(5, rating)) / 5 * 100;
    return (
        <div className="relative inline-flex gap-0.5">
            <div className="flex gap-0.5 text-zinc-300">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
                ))}
            </div>
            <div
                className="absolute inset-0 flex gap-0.5 text-amber-400 overflow-hidden"
                style={{ width: `${pct}%` }}
                aria-hidden
            >
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
                ))}
            </div>
        </div>
    );
}

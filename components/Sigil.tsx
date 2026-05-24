// 12-house jyotish wheel — Tara's signature visual motif.
// Twelve thin spokes radiating from a central dot, with a hairline outer ring
// and four cardinal "house" markers (sun, moon, etc.) drawn as small diamonds.
// Used as a portrait halo, behind hero copy, and as a logomark.

interface SigilProps {
    size?: number;
    className?: string;
    spin?: boolean;
    accent?: string; // overrides the saffron stroke
    weight?: number;
}

export default function Sigil({
    size = 120,
    className = "",
    spin = false,
    accent,
    weight = 1,
}: SigilProps) {
    const stroke = accent ?? "currentColor";
    const half = 50;
    // 12 spokes — every 30°
    const spokes = Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = half + Math.cos(angle) * 46;
        const y = half + Math.sin(angle) * 46;
        return { x, y, major: i % 3 === 0 };
    });

    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className={`${spin ? "wheel-spin" : ""} ${className}`}
            aria-hidden
        >
            {/* outer ring */}
            <circle cx={half} cy={half} r="46" fill="none" stroke={stroke} strokeWidth={weight * 0.6} />
            {/* inner ring */}
            <circle cx={half} cy={half} r="32" fill="none" stroke={stroke} strokeWidth={weight * 0.4} opacity={0.55} />
            {/* spokes */}
            {spokes.map((s, i) => (
                <line
                    key={i}
                    x1={half}
                    y1={half}
                    x2={s.x}
                    y2={s.y}
                    stroke={stroke}
                    strokeWidth={s.major ? weight * 0.7 : weight * 0.35}
                    opacity={s.major ? 0.85 : 0.4}
                />
            ))}
            {/* four cardinal diamond markers */}
            {[0, 90, 180, 270].map((deg) => {
                const a = (deg - 90) * (Math.PI / 180);
                const cx = half + Math.cos(a) * 46;
                const cy = half + Math.sin(a) * 46;
                return (
                    <rect
                        key={deg}
                        x={cx - 1.6}
                        y={cy - 1.6}
                        width="3.2"
                        height="3.2"
                        fill={stroke}
                        transform={`rotate(45 ${cx} ${cy})`}
                    />
                );
            })}
            {/* center dot */}
            <circle cx={half} cy={half} r="1.6" fill={stroke} />
        </svg>
    );
}

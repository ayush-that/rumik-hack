import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash-image";
const OUT_DIR = "public/logo-candidates-v2";
const BASE = `Generate a high-quality iOS app icon for "Tara", an Indian astrology counsellor calling app. Strict requirements: PERFECT square aspect ratio (1024x1024), rounded-square iOS app icon shape (22% corner radius), fills the entire frame edge-to-edge, no text, no border, no padding around the icon. The mark should be bold, simple, and recognisable at small sizes — think Linear, Cursor, Vercel, Headspace level of refinement. Use crisp vector-like geometry, sharp clean edges, symmetric features. Avoid uncanny AI mascot faces, melted forms, asymmetric eyes, over-rendered detail, photoreal textures.`;

const VARIANTS = [
  {
    slug: "1-crescent-minimal",
    prompt: `${BASE} The mark is a clean minimalist CRESCENT MOON shape — sharp crisp edges, no face, no eyes. A single small five-pointed star sits inside the curve of the crescent. Background: deep indigo gradient (#1a1240 to #3a2080). The moon and star are warm cream-gold (#f8d65a). Like the Calm or Headspace app aesthetic.`,
  },
  {
    slug: "2-geometric-star",
    prompt: `${BASE} The mark is a single bold GEOMETRIC FOUR-POINT STAR (the kind you see in Catholic / Mughal architecture — long top/bottom points, shorter left/right). Crisp vector geometry, sharp edges. Star is white-cream with a subtle warm glow around it. Background: rich saffron-orange gradient (#f8721c to #d94e1f). Modern, premium, like Vercel's mark.`,
  },
  {
    slug: "3-sun-mandala",
    prompt: `${BASE} The mark is a STYLISED SUN / MANDALA — concentric circular geometry with 8 simple rays, like an Indian sun motif but geometric and modern, not ornate. White-cream colour. Background: rich saffron-to-rose gradient (#e94e4e to #f8721c). Reminiscent of Tibetan / Indian sacred geometry simplified to logo level.`,
  },
  {
    slug: "4-mascot-star-refined",
    prompt: `${BASE} The mark is a friendly 5-POINT STAR CHARACTER with a clean, simple, symmetric face — two small dot eyes and a tiny soft smile, no over-rendered sparkle eyes. Slightly chubby rounded form. Smooth soft 3D shading, vector-feel, NOT photoreal. Background: warm gold (#f8c83a). Aesthetic close to the cleaner cute mascots in the reference grid (Slack, Discord nitro stickers) but refined.`,
  },
  {
    slug: "5-mascot-moon-refined",
    prompt: `${BASE} The mark is a friendly CRESCENT MOON CHARACTER — clean simple curved crescent body, two small symmetric dot eyes, a tiny soft smile, no over-rendered features. Smooth soft 3D shading. Background: deep purple (#3a2080) with a faint star or two scattered around the moon (not overpowering). Aesthetic close to Twitch / cleaner mascot icons in the reference grid.`,
  },
  {
    slug: "6-tara-glyph",
    prompt: `${BASE} The mark is an ABSTRACT TARA GLYPH — a single fluid stroke / wordmark-like shape that suggests both a star and the letter T (for Tara). Like a brand monogram (think Substack's S, Vercel's triangle). Clean sharp geometry, white-cream on a saffron-rose gradient background (#f8721c to #c63d3d). Premium, distinctive, no mascot.`,
  },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const v of VARIANTS) {
  const outPath = `${OUT_DIR}/${v.slug}.png`;
  if (existsSync(outPath)) { console.log(`skip ${v.slug} (exists)`); continue; }
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: v.prompt }] }],
    });
    const part = res.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
    if (!part?.inlineData?.data) { console.error(`no image returned for ${v.slug}`); continue; }
    writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`wrote ${outPath}`);
  } catch (e) {
    console.error(`error on ${v.slug}:`, e.message);
  }
}

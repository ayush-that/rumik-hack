import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash-image";
const OUT_DIR = "public/logo-candidates";
const REF_IMAGE = "/Users/shydev/.claude/image-cache/518a3efc-b5f4-4b2f-a206-49c5578a30c0/5.png";

const BASE = `Look at this app icon style reference grid and generate a high-quality app icon for "Tara", following the EXACT same visual style — rounded-square format (iOS-style ~22% corner radius), bold solid color background, cute character mascot with very large expressive eyes, soft 3D-rendered look with subtle gradients and gentle highlights, professional production quality, no text, no border, fills the full square frame.

Tara is a counsellor app where people call astrologers for guidance on marriage, health, wealth, legal, finance and career. The vibe should feel warm, friendly, calming, and a little mystical — never spooky.`;

const VARIANTS = [
  { slug: "1-crescent-moon",   prompt: `${BASE} The mascot is a cute smiling CRESCENT MOON character with two big sparkly eyes and a small soft smile. Background: deep indigo-purple (#3a2080) with a faint scatter of tiny stars.` },
  { slug: "2-star",            prompt: `${BASE} The mascot is a cute smiling 5-pointed STAR character with two big sparkly eyes and a small soft smile, slightly chubby rounded form. Background: warm gold-yellow (#f8c83a).` },
  { slug: "3-speech-bubble",   prompt: `${BASE} The mascot is a cute soft SPEECH BUBBLE shape with two big sparkly eyes and a tiny star inside, suggesting "talking to a star". Background: soft cream-orange (#f8b070).` },
  { slug: "4-crystal-orb",     prompt: `${BASE} The mascot is a cute smiling GLOWING ORB / mystical crystal ball with two big expressive eyes peeking through, gentle inner glow. Background: deep teal-purple gradient (#2a1850 to #4a2080).` },
];

mkdirSync(OUT_DIR, { recursive: true });

const refBytes = readFileSync(REF_IMAGE);
const refPart = { inlineData: { mimeType: "image/png", data: refBytes.toString("base64") } };

for (const v of VARIANTS) {
  const outPath = `${OUT_DIR}/${v.slug}.png`;
  if (existsSync(outPath)) { console.log(`skip ${v.slug} (exists)`); continue; }
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [refPart, { text: v.prompt }] }],
    });
    const part = res.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
    if (!part?.inlineData?.data) { console.error(`no image returned for ${v.slug}`); continue; }
    writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`wrote ${outPath}`);
  } catch (e) {
    console.error(`error on ${v.slug}:`, e.message);
  }
}

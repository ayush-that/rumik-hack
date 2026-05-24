import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash-image";
const OUT_DIR = "public/portraits";

const STYLE_SUFFIX =
  "Studio portrait, head-and-shoulders, soft natural lighting, plain off-white background, friendly warm expression, sharp focus, professional headshot, photorealistic.";

const PORTRAITS = [
  { slug: "pratyuksha", prompt: "Indian woman in her early 30s, long black hair with a center part, small bindi, traditional saree blouse in deep red." },
  { slug: "gracy",      prompt: "Indian woman in her late 20s, shoulder-length wavy hair, soft makeup, mustard-yellow kurta with floral print." },
  { slug: "lishvika",   prompt: "Indian woman in her mid 30s, long straight dark hair, light makeup, simple cream kurta." },
  { slug: "deepanshi",  prompt: "Indian woman in her late 20s wearing thin-rimmed glasses, pulled-back hair, pale-yellow blouse." },
  { slug: "prarthna",   prompt: "Indian woman in her 40s, dark hair tied back, subtle traditional jewellery, maroon kurta." },
  { slug: "siya",       prompt: "Indian woman in her 30s, hair pulled back with a small bindi, simple white kurta with thin embroidery." },
  { slug: "bhavyanshi", prompt: "Indian woman in her late 20s, long dark hair, modern look, dark red top." },
  { slug: "devrajit",   prompt: "Indian man in his 50s, grey hair and beard, thin metal-frame glasses, charcoal blazer over a light shirt." },
  { slug: "parasharya", prompt: "Indian man in his 50s, weathered face, traditional bright-orange turban, off-white kurta." },
  { slug: "jeeshan",    prompt: "Indian man in his late 20s, short black hair, clean-shaven, light-blue collared shirt." },
  { slug: "amit",       prompt: "Indian man in his 30s, short hair, light stubble, simple grey t-shirt." },
  { slug: "rohan",      prompt: "Indian man in his 40s, salt-and-pepper hair, trimmed beard, navy kurta." },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const p of PORTRAITS) {
  const outPath = `${OUT_DIR}/${p.slug}.png`;
  if (existsSync(outPath)) { console.log(`skip ${p.slug} (exists)`); continue; }
  const prompt = `${p.prompt} ${STYLE_SUFFIX}`;
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const part = res.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
    if (!part?.inlineData?.data) { console.error(`no image returned for ${p.slug}`); continue; }
    writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
    console.log(`wrote ${outPath}`);
  } catch (e) {
    console.error(`error on ${p.slug}:`, e.message);
  }
}

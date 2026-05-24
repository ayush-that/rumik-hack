# Counsellor Directory Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first counsellor directory frontend (astrotalk-clone style) backed by Convex. Categories, counsellor cards with availability + pricing, and Call CTAs that route to a placeholder call screen. Voice agent integration is out of scope.

**Architecture:** Next.js 16 App Router + Convex. New `counsellors` table seeded once with 12 portraits generated via Gemini 2.5 Flash Image (nano banana) into `/public/portraits/`. Directory lives at `/dashboard` (auth-gated, already protected). UI is mobile-first (max-width ~480px) with a fixed bottom nav. Filter state is driven by URL search params so the page can be a server component.

**Tech Stack:** Next.js 16, React 19, Convex 1.34, Better Auth 1.5 (existing), Tailwind CSS v4, Lucide icons, `@google/genai` SDK for one-off asset generation.

---

## File Structure

- `.env.local`, `.env.example` — add `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `FAL_API_KEY`, `MISTRAL_API_KEY`
- `scripts/generate-portraits.mjs` — one-off Node script: prompts Gemini for 12 counsellor portraits, writes PNGs into `public/portraits/`
- `public/portraits/*.png` — generated, committed
- `lib/constants.ts` — `CATEGORIES` (marriage, health, wealth, legal, finance, career), `FILTER_MODES` (all, celebrity, new), `SEED_COUNSELLORS` (typed seed records referencing portraits)
- `convex/schema.ts` — extend with `counsellors` table + indexes
- `convex/counsellors.ts` — `list` query (filters by category/mode), `getById` query, `seed` internal mutation
- `app/globals.css` — replace dark tokens with light astrotalk-style tokens; add safe-area utilities
- `app/(dashboard)/layout.tsx` — wrap children in `<main class="mx-auto max-w-[480px] ...">` and render `<BottomNav>`
- `app/(dashboard)/dashboard/page.tsx` — server component: reads `?category=`/`?mode=`, runs Convex `list` query, renders directory
- `app/(dashboard)/dashboard/counsellor/[id]/page.tsx` — server component: fetches counsellor, renders detail
- `app/(dashboard)/dashboard/call/[id]/page.tsx` — placeholder "Connecting…" screen
- `app/(dashboard)/dashboard/chat/page.tsx` — "Coming soon" stub
- `app/(dashboard)/dashboard/remedies/page.tsx` — "Coming soon" stub
- `components/DashboardHeader.tsx` — server component (reads user via existing helpers) — avatar, greeting, Add Cash, search, msg icons
- `components/RechargeBanner.tsx` — yellow promo banner
- `components/CategoryChips.tsx` — client component, horizontal scroll, links with `?category=`
- `components/FilterChips.tsx` — client component, `?mode=` links
- `components/CounsellorCard.tsx` — server component, single row card with Call link
- `components/BottomNav.tsx` — client component for active-tab styling
- `components/EmptyState.tsx` — shared "no counsellors" message
- `components/ComingSoon.tsx` — shared placeholder for chat/remedies

The old `app/(dashboard)/dashboard/DashboardPage.tsx` (logout-only welcome) is deleted; its logout button moves into a new `components/UserMenu.tsx` rendered inside `DashboardHeader`.

---

## Tasks

### Task 1: Add AI provider env vars

**Files:**
- Modify: `.env.local`
- Modify: `.env.example`

- [ ] **Step 1: Append keys to `.env.local`**

Append these lines (overwrite if already present):

```
# AI providers (values provided out-of-band; do not commit real values)
GEMINI_API_KEY=<redacted>
ANTHROPIC_API_KEY=<redacted>
OPENROUTER_API_KEY=<redacted>
FAL_API_KEY=<redacted>
MISTRAL_API_KEY=<redacted>
```

- [ ] **Step 2: Create/overwrite `.env.example` with same keys, redacted**

```
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=

# Better Auth
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=

# AI providers
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
FAL_API_KEY=
MISTRAL_API_KEY=
```

- [ ] **Step 3: Verify `.env.local` is gitignored**

Run: `git check-ignore -v .env.local`
Expected: line referencing `.gitignore:.env*`

- [ ] **Step 4: Commit `.env.example`**

```bash
git add .env.example
git commit -m "chore: document required env vars"
```

---

### Task 2: Install Gemini SDK as dev dep

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

Run: `pnpm add -D @google/genai`

- [ ] **Step 2: Verify install**

Run: `pnpm list @google/genai`
Expected: line showing `@google/genai` resolved.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @google/genai for asset generation"
```

---

### Task 3: Asset generation script

**Files:**
- Create: `scripts/generate-portraits.mjs`

- [ ] **Step 1: Write the script**

```js
// scripts/generate-portraits.mjs
import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash-image-preview";
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
  if (existsSync(outPath)) {
    console.log(`skip ${p.slug} (exists)`);
    continue;
  }
  const prompt = `${p.prompt} ${STYLE_SUFFIX}`;
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const part = res.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
  if (!part?.inlineData?.data) {
    console.error(`no image returned for ${p.slug}`);
    continue;
  }
  writeFileSync(outPath, Buffer.from(part.inlineData.data, "base64"));
  console.log(`wrote ${outPath}`);
}
```

- [ ] **Step 2: Install dotenv**

Run: `pnpm add -D dotenv`

- [ ] **Step 3: Commit the script (assets come in next task)**

```bash
git add scripts/generate-portraits.mjs package.json pnpm-lock.yaml
git commit -m "chore: add portrait generation script"
```

---

### Task 4: Generate portraits

**Files:**
- Create: `public/portraits/*.png` (×12)

- [ ] **Step 1: Run the script**

Run: `node scripts/generate-portraits.mjs`
Expected: 12 lines `wrote public/portraits/<slug>.png`

If the model name errors with "model not found", retry with `gemini-2.5-flash-image` (the non-preview alias).

- [ ] **Step 2: Eyeball results**

Run: `ls -la public/portraits/`
Expected: 12 PNGs, each >50 KB.

Open 2-3 of them visually to sanity-check they look like Indian counsellor portraits and not nonsense.

- [ ] **Step 3: Commit assets**

```bash
git add public/portraits/
git commit -m "feat: add generated counsellor portraits"
```

---

### Task 5: Categories + seed data constants

**Files:**
- Create: `lib/constants.ts`

- [ ] **Step 1: Write the file**

```ts
// lib/constants.ts
import {
  Briefcase,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Scale,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type CategorySlug =
  | "marriage"
  | "health"
  | "wealth"
  | "legal"
  | "finance"
  | "career";

export const CATEGORIES: { slug: CategorySlug; label: string; icon: LucideIcon }[] = [
  { slug: "marriage", label: "Marriage", icon: HeartHandshake },
  { slug: "health",   label: "Health",   icon: HeartPulse },
  { slug: "wealth",   label: "Wealth",   icon: Wallet },
  { slug: "legal",    label: "Legal",    icon: Scale },
  { slug: "finance",  label: "Finance",  icon: Landmark },
  { slug: "career",   label: "Career",   icon: Briefcase },
];

export type FilterMode = "all" | "celebrity" | "new";

export const FILTER_MODES: { slug: FilterMode; label: string }[] = [
  { slug: "all",       label: "All" },
  { slug: "celebrity", label: "Celebrity" },
  { slug: "new",       label: "NEW!" },
];

export type SeedCounsellor = {
  slug: string;
  name: string;
  portrait: string; // path under /public
  specialties: string[];
  languages: string[];
  experienceYears: number;
  rating: number;
  ordersCount: number;
  pricePerMin: number;
  originalPricePerMin: number;
  waitMinutes: number; // 0 = available
  isCelebrity: boolean;
  isNew: boolean;
  categories: CategorySlug[];
};

export const SEED_COUNSELLORS: SeedCounsellor[] = [
  { slug: "pratyuksha", name: "Pratyuksha", portrait: "/portraits/pratyuksha.png", specialties: ["Vedic", "Tarot", "Face Reading"], languages: ["English", "Hindi"], experienceYears: 13, rating: 4.9, ordersCount: 10000, pricePerMin: 5,  originalPricePerMin: 23, waitMinutes: 4,  isCelebrity: true,  isNew: false, categories: ["marriage", "career"] },
  { slug: "gracy",      name: "Gracy",      portrait: "/portraits/gracy.png",      specialties: ["Tarot", "Psychic"],            languages: ["English", "Hindi"], experienceYears: 7,  rating: 4.6, ordersCount: 1000,  pricePerMin: 5,  originalPricePerMin: 33, waitMinutes: 6,  isCelebrity: false, isNew: false, categories: ["marriage", "legal"] },
  { slug: "lishvika",   name: "Lishvika",   portrait: "/portraits/lishvika.png",   specialties: ["Tarot", "Life Coach"],         languages: ["English", "Hindi"], experienceYears: 10, rating: 4.8, ordersCount: 5000,  pricePerMin: 5,  originalPricePerMin: 23, waitMinutes: 0,  isCelebrity: false, isNew: false, categories: ["legal", "career"] },
  { slug: "devrajit",   name: "Devrajit",   portrait: "/portraits/devrajit.png",   specialties: ["Vedic", "Numerology", "Vastu"], languages: ["English", "Hindi"], experienceYears: 16, rating: 4.9, ordersCount: 10000, pricePerMin: 5,  originalPricePerMin: 37, waitMinutes: 0,  isCelebrity: true,  isNew: false, categories: ["wealth", "finance"] },
  { slug: "siya",       name: "Siya",       portrait: "/portraits/siya.png",       specialties: ["Tarot", "Psychic", "Vastu"],   languages: ["Hindi"],            experienceYears: 4,  rating: 4.5, ordersCount: 500,   pricePerMin: 5,  originalPricePerMin: 18, waitMinutes: 0,  isCelebrity: false, isNew: true,  categories: ["health"] },
  { slug: "parasharya", name: "Parasharya", portrait: "/portraits/parasharya.png", specialties: ["Vedic", "Palmistry"],          languages: ["English", "Hindi"], experienceYears: 8,  rating: 4.7, ordersCount: 10000, pricePerMin: 5,  originalPricePerMin: 25, waitMinutes: 16, isCelebrity: false, isNew: false, categories: ["marriage", "career", "wealth"] },
  { slug: "jeeshan",    name: "Jeeshan",    portrait: "/portraits/jeeshan.png",    specialties: ["Vedic", "Face Reading", "Life Coach"], languages: ["English", "Hindi"], experienceYears: 7, rating: 4.7, ordersCount: 10000, pricePerMin: 5, originalPricePerMin: 30, waitMinutes: 0, isCelebrity: false, isNew: false, categories: ["health", "career"] },
  { slug: "bhavyanshi", name: "Bhavyanshi", portrait: "/portraits/bhavyanshi.png", specialties: ["Vedic", "Life Coach"],         languages: ["Hindi", "English"], experienceYears: 3,  rating: 4.4, ordersCount: 10000, pricePerMin: 5,  originalPricePerMin: 24, waitMinutes: 0,  isCelebrity: false, isNew: true,  categories: ["marriage", "health"] },
  { slug: "amit",       name: "Amit",       portrait: "/portraits/amit.png",       specialties: ["Vedic"],                       languages: ["Hindi"],            experienceYears: 5,  rating: 4.3, ordersCount: 2000,  pricePerMin: 5,  originalPricePerMin: 20, waitMinutes: 0,  isCelebrity: false, isNew: false, categories: ["finance", "wealth"] },
  { slug: "deepanshi",  name: "Deepanshi",  portrait: "/portraits/deepanshi.png",  specialties: ["Tarot", "Numerology"],         languages: ["English", "Hindi"], experienceYears: 5,  rating: 4.6, ordersCount: 10000, pricePerMin: 5,  originalPricePerMin: 24, waitMinutes: 0,  isCelebrity: false, isNew: false, categories: ["marriage", "career"] },
  { slug: "prarthna",   name: "Prarthna",   portrait: "/portraits/prarthna.png",   specialties: ["Numerology", "Tarot", "Vedic"], languages: ["English", "Hindi"], experienceYears: 12, rating: 4.8, ordersCount: 8000, pricePerMin: 5, originalPricePerMin: 28, waitMinutes: 0, isCelebrity: true, isNew: false, categories: ["wealth", "marriage"] },
  { slug: "rohan",      name: "Rohan",      portrait: "/portraits/rohan.png",      specialties: ["Vedic", "Vastu"],              languages: ["English", "Hindi"], experienceYears: 9,  rating: 4.7, ordersCount: 6000,  pricePerMin: 5,  originalPricePerMin: 27, waitMinutes: 0,  isCelebrity: false, isNew: false, categories: ["legal", "finance"] },
];
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add categories and counsellor seed constants"
```

---

### Task 6: Convex schema — counsellors table

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Replace `convex/schema.ts` with the extended schema**

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        authId: v.string(),
        dodoCustomerId: v.optional(v.string()),
        image: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_authId", ["authId"]),

    counsellors: defineTable({
        slug: v.string(),
        name: v.string(),
        portrait: v.string(),
        specialties: v.array(v.string()),
        languages: v.array(v.string()),
        experienceYears: v.number(),
        rating: v.number(),
        ordersCount: v.number(),
        pricePerMin: v.number(),
        originalPricePerMin: v.number(),
        waitMinutes: v.number(),
        isCelebrity: v.boolean(),
        isNew: v.boolean(),
        categories: v.array(v.string()),
    })
        .index("by_slug", ["slug"]),
});
```

- [ ] **Step 2: Push schema**

Background convex dev should pick it up automatically. If not running, run: `npx convex dev --once`.
Expected: `Added table indexes: counsellors.by_slug` and `Convex functions ready!`.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add counsellors table"
```

---

### Task 7: Convex queries + seed mutation

**Files:**
- Create: `convex/counsellors.ts`

- [ ] **Step 1: Write the file**

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {
        category: v.optional(v.string()),
        mode: v.optional(v.union(v.literal("all"), v.literal("celebrity"), v.literal("new"))),
    },
    handler: async (ctx, { category, mode }) => {
        const all = await ctx.db.query("counsellors").collect();
        return all.filter((c) => {
            if (category && !c.categories.includes(category)) return false;
            if (mode === "celebrity" && !c.isCelebrity) return false;
            if (mode === "new" && !c.isNew) return false;
            return true;
        });
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, { slug }) => {
        return ctx.db
            .query("counsellors")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
    },
});

// Public for hackathon convenience so we can call it via `npx convex run`.
// In production this should be `internalMutation` + an admin-only invoker.
export const seed = mutation({
    args: {
        records: v.array(
            v.object({
                slug: v.string(),
                name: v.string(),
                portrait: v.string(),
                specialties: v.array(v.string()),
                languages: v.array(v.string()),
                experienceYears: v.number(),
                rating: v.number(),
                ordersCount: v.number(),
                pricePerMin: v.number(),
                originalPricePerMin: v.number(),
                waitMinutes: v.number(),
                isCelebrity: v.boolean(),
                isNew: v.boolean(),
                categories: v.array(v.string()),
            }),
        ),
    },
    handler: async (ctx, { records }) => {
        for (const r of records) {
            const existing = await ctx.db
                .query("counsellors")
                .withIndex("by_slug", (q) => q.eq("slug", r.slug))
                .first();
            if (existing) {
                await ctx.db.patch(existing._id, r);
            } else {
                await ctx.db.insert("counsellors", r);
            }
        }
        return records.length;
    },
});
```

- [ ] **Step 2: Wait for codegen**

Background convex dev regenerates types. Run `pnpm exec tsc --noEmit` and expect no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/counsellors.ts
git commit -m "feat: counsellor list/getBySlug queries + seed mutation"
```

---

### Task 8: Run the seed

**Files:**
- Create: `scripts/seed-counsellors.mjs`

- [ ] **Step 1: Write seed runner that emits JSON args from the TS constants**

```js
// scripts/seed-counsellors.mjs
// Reads SEED_COUNSELLORS from lib/constants.ts via tsx and writes the JSON args file.
import { writeFileSync } from "node:fs";
import { SEED_COUNSELLORS } from "../lib/constants.ts";

writeFileSync("/tmp/seed-counsellors.json", JSON.stringify({ records: SEED_COUNSELLORS }));
console.log("wrote /tmp/seed-counsellors.json");
```

- [ ] **Step 2: Install tsx (one-shot TS runner)**

Run: `pnpm add -D tsx`

- [ ] **Step 3: Emit args file**

Run: `pnpm exec tsx scripts/seed-counsellors.mjs`
Expected: `wrote /tmp/seed-counsellors.json`.

- [ ] **Step 4: Invoke the seed mutation**

Run: `npx convex run counsellors:seed "$(cat /tmp/seed-counsellors.json)"`
Expected: response `12`.

- [ ] **Step 5: Verify**

Run: `npx convex data counsellors --limit 20`
Expected: 12 rows.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-counsellors.mjs package.json pnpm-lock.yaml
git commit -m "chore: seed counsellors in convex"
```

---

### Task 9: Light theme tokens in `globals.css`

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the file's `:root` block (keep imports and font-face)**

Open `app/globals.css`. Inside the existing `@theme inline` (or equivalent) block, set:

```css
:root {
    --background: #fdf8eb;          /* warm cream */
    --foreground: #1a1a1a;
    --muted: #1a1a1a;               /* used by .text-muted in existing files */
    --muted-foreground: #6b6b6b;
    --card: #ffffff;
    --card-border: #ececec;
    --primary: #1aa37a;             /* call-green */
    --primary-foreground: #ffffff;
    --danger: #e94e4e;              /* busy-red */
    --accent-yellow: #f8d65a;
    --chip-active: #1f6bff;
}

body {
    background: var(--background);
    color: var(--foreground);
}

/* Hide scrollbar for horizontal chip rows */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
```

Remove any explicit `bg-black` defaults from existing utility overrides.

- [ ] **Step 2: Verify dev server still renders without errors**

Visit `http://localhost:3000/sign-in` — should now be on a cream background.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: switch to light astrotalk theme tokens"
```

---

### Task 10: Mobile shell + bottom nav

**Files:**
- Create: `components/BottomNav.tsx`
- Modify: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Write `BottomNav.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Phone, Sparkles } from "lucide-react";

const TABS = [
    { href: "/dashboard",          label: "Home",     Icon: Home },
    { href: "/dashboard/chat",     label: "Chat",     Icon: MessageSquare },
    { href: "/dashboard/call",     label: "Call",     Icon: Phone },
    { href: "/dashboard/remedies", label: "Remedies", Icon: Sparkles },
];

export default function BottomNav() {
    const pathname = usePathname();
    return (
        <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-white border-t border-[var(--card-border)] flex justify-around py-2 z-50">
            {TABS.map(({ href, label, Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                    <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs">
                        <Icon size={22} strokeWidth={active ? 2.4 : 1.6} className={active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"} />
                        <span className={active ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
```

- [ ] **Step 2: Replace `app/(dashboard)/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "../globals.css";
import { isAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ClientAuthBoundary } from "@/lib/auth-client";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = { title: "Dashboard", description: "Dashboard" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    if (!(await isAuthenticated())) redirect("/sign-in");
    return (
        <ClientAuthBoundary>
            <main className="mx-auto max-w-[480px] min-h-screen bg-[var(--background)] pb-20">
                {children}
            </main>
            <BottomNav />
        </ClientAuthBoundary>
    );
}
```

- [ ] **Step 3: Verify in browser**

Reload `/dashboard`. The page should be narrow with a fixed bottom nav. Don't worry that content is still the old welcome screen — that's swapped later.

- [ ] **Step 4: Commit**

```bash
git add components/BottomNav.tsx app/\(dashboard\)/layout.tsx
git commit -m "feat: mobile shell with bottom nav"
```

---

### Task 11: DashboardHeader

**Files:**
- Create: `components/DashboardHeader.tsx`
- Create: `components/UserMenu.tsx`

- [ ] **Step 1: Write `UserMenu.tsx` (client, just a logout dropdown)**

```tsx
"use client";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu({ initial }: { initial: string }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    return (
        <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-700 font-semibold flex items-center justify-center">
                {initial}
            </button>
            {open && (
                <div className="absolute left-0 mt-2 w-32 bg-white border border-[var(--card-border)] rounded-lg shadow-md z-50">
                    <button
                        onClick={async () => { await signOut(); router.push("/sign-in"); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Write `DashboardHeader.tsx` (server component)**

```tsx
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Search, MessageCircle, Plus } from "lucide-react";
import UserMenu from "./UserMenu";

export default async function DashboardHeader() {
    const user = await fetchAuthQuery(api.auth.getCurrentUser);
    const firstName = user?.name?.split(" ")[0] ?? "there";
    const initial = (firstName[0] ?? "U").toUpperCase();
    return (
        <header className="flex items-center gap-3 px-4 py-3 bg-[var(--background)]">
            <UserMenu initial={initial} />
            <span className="text-lg font-semibold">Hi {firstName}</span>
            <div className="ml-auto flex items-center gap-3">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-zinc-300 text-sm font-medium">
                    <span>Add Cash</span>
                    <Plus size={16} className="rounded-full bg-black text-white p-0.5" />
                </button>
                <Search size={22} className="text-zinc-700" />
                <MessageCircle size={22} className="text-zinc-700" />
            </div>
        </header>
    );
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/DashboardHeader.tsx components/UserMenu.tsx
git commit -m "feat: dashboard header with user menu"
```

---

### Task 12: RechargeBanner

**Files:**
- Create: `components/RechargeBanner.tsx`

- [ ] **Step 1: Write it**

```tsx
export default function RechargeBanner() {
    return (
        <div className="mx-4 mt-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-6 py-5 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">100% Cashback!</h2>
            <div className="my-2 flex items-center justify-center gap-2 text-xs tracking-widest text-zinc-500">
                <span className="h-px flex-1 bg-zinc-300" />
                ON FIRST RECHARGE
                <span className="h-px flex-1 bg-zinc-300" />
            </div>
            <button className="mt-1 rounded-full bg-[var(--accent-yellow)] px-6 py-2 text-sm font-bold tracking-wide">
                RECHARGE NOW
            </button>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/RechargeBanner.tsx
git commit -m "feat: recharge banner"
```

---

### Task 13: CategoryChips + FilterChips

**Files:**
- Create: `components/CategoryChips.tsx`
- Create: `components/FilterChips.tsx`

- [ ] **Step 1: Write `CategoryChips.tsx`**

```tsx
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, type CategorySlug } from "@/lib/constants";

export default function CategoryChips() {
    const params = useSearchParams();
    const active = (params.get("category") ?? "") as CategorySlug | "";
    return (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            {CATEGORIES.map(({ slug, label, icon: Icon }) => {
                const isActive = active === slug;
                const next = new URLSearchParams(params);
                if (isActive) next.delete("category"); else next.set("category", slug);
                return (
                    <Link
                        key={slug}
                        href={`?${next.toString()}`}
                        scroll={false}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border ${isActive ? "border-[var(--chip-active)] text-[var(--chip-active)] bg-white" : "border-zinc-200 bg-white text-zinc-700"}`}
                    >
                        <Icon size={16} className={isActive ? "text-[var(--chip-active)]" : "text-zinc-500"} />
                        <span className="text-sm font-medium">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
```

- [ ] **Step 2: Write `FilterChips.tsx`**

```tsx
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FILTER_MODES } from "@/lib/constants";
import { Crown, Sparkle, SlidersHorizontal } from "lucide-react";

const ICONS = { all: SlidersHorizontal, celebrity: Crown, new: Sparkle } as const;

export default function FilterChips() {
    const params = useSearchParams();
    const active = params.get("mode") ?? "all";
    return (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            {FILTER_MODES.map(({ slug, label }) => {
                const isActive = active === slug;
                const next = new URLSearchParams(params);
                if (slug === "all") next.delete("mode"); else next.set("mode", slug);
                const Icon = ICONS[slug];
                return (
                    <Link
                        key={slug}
                        href={`?${next.toString()}`}
                        scroll={false}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border ${isActive ? "border-amber-400 bg-amber-50 text-zinc-900" : "border-zinc-200 bg-white text-zinc-700"}`}
                    >
                        <Icon size={16} />
                        <span className="text-sm font-medium">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/CategoryChips.tsx components/FilterChips.tsx
git commit -m "feat: category and filter chip rows"
```

---

### Task 14: CounsellorCard

**Files:**
- Create: `components/CounsellorCard.tsx`

- [ ] **Step 1: Write the card**

```tsx
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function formatOrders(n: number) {
    if (n >= 10000) return "10k+ orders";
    if (n >= 5000)  return "5k+ orders";
    if (n >= 1000)  return `${Math.floor(n / 1000)}k+ orders`;
    return `${n} orders`;
}

export default function CounsellorCard({ c }: { c: Doc<"counsellors"> }) {
    const available = c.waitMinutes === 0;
    return (
        <article className="mx-4 my-3 rounded-2xl bg-white border border-[var(--card-border)] p-4 flex gap-3">
            <Link href={`/dashboard/counsellor/${c.slug}`} className="shrink-0">
                <Image src={c.portrait} alt={c.name} width={88} height={88} className="rounded-full object-cover h-22 w-22" />
                <div className="flex justify-center mt-2 gap-0.5 text-zinc-300">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                </div>
                <p className="text-[10px] text-zinc-500 text-center mt-0.5">{formatOrders(c.ordersCount)}</p>
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight truncate">{c.name}</h3>
                    <BadgeCheck size={20} className="text-emerald-500 fill-emerald-500/15" />
                </div>
                <p className="text-sm text-zinc-600 truncate">{c.specialties.join(",  ")}</p>
                <p className="text-sm text-zinc-600 truncate">{c.languages.join(", ")}</p>
                <p className="text-sm text-zinc-600">Exp- {c.experienceYears} Years</p>
                <p className="text-sm">
                    <span className="text-zinc-400 line-through">₹{c.originalPricePerMin}</span>{" "}
                    <span className="text-red-500 font-semibold">₹{c.pricePerMin}/min</span>
                </p>
            </div>

            <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                <Link
                    href={`/dashboard/call/${c.slug}`}
                    className={`px-6 py-2 rounded-full border text-sm font-semibold ${available ? "border-emerald-500 text-emerald-600" : "border-red-400 text-red-500"}`}
                >
                    Call
                </Link>
                {!available && <span className="text-xs text-red-400">wait ~ {c.waitMinutes}m</span>}
            </div>
        </article>
    );
}
```

- [ ] **Step 2: Whitelist remote image domain (none needed — assets are local)**

Verify `next.config.ts` doesn't need changes (using `/public/` paths).

- [ ] **Step 3: Commit**

```bash
git add components/CounsellorCard.tsx
git commit -m "feat: counsellor card component"
```

---

### Task 15: Directory page (server)

**Files:**
- Delete: `app/(dashboard)/dashboard/DashboardPage.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Delete the old client wrapper**

```bash
git rm app/\(dashboard\)/dashboard/DashboardPage.tsx
```

- [ ] **Step 2: Rewrite `page.tsx`**

```tsx
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import DashboardHeader from "@/components/DashboardHeader";
import RechargeBanner from "@/components/RechargeBanner";
import CategoryChips from "@/components/CategoryChips";
import FilterChips from "@/components/FilterChips";
import CounsellorCard from "@/components/CounsellorCard";

type SP = { category?: string; mode?: "celebrity" | "new" | "all" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
    const sp = await searchParams;
    const counsellors = await fetchAuthQuery(api.counsellors.list, {
        category: sp.category,
        mode: sp.mode === "celebrity" || sp.mode === "new" ? sp.mode : undefined,
    });
    return (
        <>
            <DashboardHeader />
            <RechargeBanner />
            <CategoryChips />
            <FilterChips />
            <div>
                {counsellors.length === 0 ? (
                    <p className="text-center text-zinc-500 mt-8">No counsellors match these filters.</p>
                ) : (
                    counsellors.map((c) => <CounsellorCard key={c._id} c={c} />)
                )}
            </div>
        </>
    );
}
```

- [ ] **Step 3: Reload `/dashboard` and verify**

In browser: header, banner, two chip rows, list of 12 cards visible. Click a category chip — list updates. Click again — clears filter.

- [ ] **Step 4: Commit**

```bash
git add app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: counsellor directory page"
```

---

### Task 16: Counsellor detail page

**Files:**
- Create: `app/(dashboard)/dashboard/counsellor/[id]/page.tsx`

- [ ] **Step 1: Write it**

```tsx
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowLeft, Phone } from "lucide-react";

export default async function CounsellorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();
    const available = c.waitMinutes === 0;
    return (
        <div className="px-4 pt-3">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-zinc-600 mb-3">
                <ArrowLeft size={16} /> Back
            </Link>
            <div className="flex flex-col items-center text-center">
                <Image src={c.portrait} alt={c.name} width={140} height={140} className="rounded-full object-cover h-36 w-36" />
                <h1 className="mt-3 text-2xl font-bold tracking-tight flex items-center gap-2 justify-center">
                    {c.name} <BadgeCheck size={20} className="text-emerald-500" />
                </h1>
                <p className="text-zinc-600">{c.specialties.join(" · ")}</p>
                <p className="text-zinc-600">{c.languages.join(", ")}</p>
                <p className="text-zinc-600">Exp- {c.experienceYears} Years · {c.ordersCount.toLocaleString()} orders</p>
                <p className="mt-2 text-lg">
                    <span className="text-zinc-400 line-through mr-2">₹{c.originalPricePerMin}</span>
                    <span className="text-red-500 font-semibold">₹{c.pricePerMin}/min</span>
                </p>
            </div>
            <Link
                href={`/dashboard/call/${c.slug}`}
                className={`mt-8 flex items-center justify-center gap-2 w-full py-3 rounded-full font-semibold ${available ? "bg-emerald-500 text-white" : "bg-red-100 text-red-600"}`}
            >
                <Phone size={18} />
                {available ? "Call now" : `Call (wait ~ ${c.waitMinutes}m)`}
            </Link>
        </div>
    );
}
```

- [ ] **Step 2: Verify in browser**

Click any card portrait or name → lands on `/dashboard/counsellor/<slug>` with big portrait + Call button.

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/counsellor/\[id\]/page.tsx
git commit -m "feat: counsellor detail page"
```

---

### Task 17: Call placeholder screen

**Files:**
- Create: `app/(dashboard)/dashboard/call/[id]/page.tsx`
- Create: `app/(dashboard)/dashboard/call/page.tsx` (bottom-nav index)

- [ ] **Step 1: Write the dynamic placeholder**

```tsx
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Phone, PhoneOff } from "lucide-react";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const c = await fetchAuthQuery(api.counsellors.getBySlug, { slug: id });
    if (!c) notFound();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <Image src={c.portrait} alt={c.name} width={160} height={160} className="rounded-full object-cover h-40 w-40" />
            <h1 className="mt-4 text-2xl font-bold">{c.name}</h1>
            <p className="text-zinc-500 mt-1">Connecting…</p>
            <div className="mt-3 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse [animation-delay:300ms]" />
            </div>
            <Link
                href={`/dashboard/counsellor/${c.slug}`}
                className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold"
            >
                <PhoneOff size={18} /> End
            </Link>
            <p className="text-xs text-zinc-400 mt-6">Voice agent integration coming soon.</p>
        </div>
    );
}
```

- [ ] **Step 2: Write `/dashboard/call/page.tsx` (bottom-nav index)**

```tsx
import { Phone } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function CallIndexPage() {
    return <ComingSoon icon={<Phone size={32} />} title="Call History" message="Your past calls will show up here." />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/dashboard/call
git commit -m "feat: call placeholder screen + history stub"
```

---

### Task 18: Coming-soon stubs (Chat, Remedies, shared component)

**Files:**
- Create: `components/ComingSoon.tsx`
- Create: `app/(dashboard)/dashboard/chat/page.tsx`
- Create: `app/(dashboard)/dashboard/remedies/page.tsx`

- [ ] **Step 1: Write `ComingSoon.tsx`**

```tsx
import type { ReactNode } from "react";

export default function ComingSoon({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-8">
            <div className="text-zinc-400 mb-3">{icon}</div>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-zinc-500 mt-1">{message}</p>
            <p className="text-xs text-zinc-400 mt-6">Coming soon.</p>
        </div>
    );
}
```

- [ ] **Step 2: Write `chat/page.tsx`**

```tsx
import { MessageSquare } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function ChatPage() {
    return <ComingSoon icon={<MessageSquare size={32} />} title="Chat" message="Chat with counsellors is coming soon." />;
}
```

- [ ] **Step 3: Write `remedies/page.tsx`**

```tsx
import { Sparkles } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function RemediesPage() {
    return <ComingSoon icon={<Sparkles size={32} />} title="Remedies" message="Personalised remedies will live here." />;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ComingSoon.tsx app/\(dashboard\)/dashboard/chat app/\(dashboard\)/dashboard/remedies
git commit -m "feat: coming-soon stubs for chat and remedies"
```

---

### Task 19: Public landing — point to /dashboard

**Files:**
- Modify: `app/(public)/page.tsx`

- [ ] **Step 1: Replace the page with a minimal CTA landing**

```tsx
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth-server";

export default async function LandingPage() {
    const authed = await isAuthenticated();
    return (
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-5xl font-bold tracking-tighter">Talk to a counsellor.</h1>
            <p className="mt-3 text-lg text-zinc-600 max-w-md">
                Marriage, health, wealth, legal, finance, career — get on a call with a verified astrologer in minutes.
            </p>
            <Link
                href={authed ? "/dashboard" : "/sign-up"}
                className="mt-8 inline-flex px-8 py-3 rounded-full bg-emerald-500 text-white font-semibold"
            >
                {authed ? "Browse counsellors" : "Get started"}
            </Link>
        </section>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(public\)/page.tsx
git commit -m "feat: minimal landing page"
```

---

### Task 20: Final QA + responsiveness pass

**Files:** (none — verification only)

- [ ] **Step 1: Build**

Run: `pnpm next build`
Expected: success, all routes listed (`/`, `/dashboard`, `/dashboard/counsellor/[id]`, `/dashboard/call/[id]`, `/dashboard/call`, `/dashboard/chat`, `/dashboard/remedies`).

- [ ] **Step 2: Browser walk-through**

In Chrome DevTools mobile mode (iPhone 14):
1. `/sign-in` → log in.
2. Land on `/dashboard` — header, banner, 6 category chips, 3 filter chips (All active), 12 cards.
3. Click "Marriage" chip → list narrows. Click again → all 12 back.
4. Click "Celebrity" mode → only celebrity counsellors. Click "NEW!" → only new.
5. Click Gracy's portrait → detail page. Click Call → call placeholder.
6. Bottom nav → Chat, Remedies, Call → all show stubs.
7. Logout via top-left avatar dropdown.

- [ ] **Step 3: Lighthouse / console clean**

Open DevTools console on `/dashboard`. No red errors. Warnings about Image `sizes` are OK to ignore for the hackathon.

- [ ] **Step 4: Commit (if any tweaks made during QA)**

```bash
git add -A
git diff --cached --quiet || git commit -m "polish: post-QA tweaks"
git push
```

---

## Out of Scope (separate plans)
- Voice agent / actual phone call (planned later — will plug into the existing `/dashboard/call/[id]` screen).
- Wallet / Add Cash flow.
- Search functionality (icon present, no-op for now).
- Counsellor onboarding / admin UI (seed only for hackathon).
- Reviews & ratings UI beyond the static 5-star display.

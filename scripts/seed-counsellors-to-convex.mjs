import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { SEED_COUNSELLORS } from "../lib/constants.ts";

const payload = JSON.stringify({ records: SEED_COUNSELLORS });
writeFileSync("/tmp/seed-counsellors.json", payload);

const result = spawnSync("npx", ["convex", "run", "counsellors:seed", payload], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);

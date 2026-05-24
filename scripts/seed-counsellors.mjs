import { writeFileSync } from "node:fs";
import { SEED_COUNSELLORS } from "../lib/constants.ts";

writeFileSync("/tmp/seed-counsellors.json", JSON.stringify({ records: SEED_COUNSELLORS }));
console.log("wrote /tmp/seed-counsellors.json");

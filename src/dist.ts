import path from "path";
import fs from "fs";

import { APPDATA, OUTPUT, VERSION } from "./metadata-constants";

// Write the version pointer the client reads. Served from GitHub Releases now
// (…/releases/latest/download/latest.json), so it must be a plain, self-
// contained JSON in the shape the app expects: { latest, updated }.
const latestJsonOutput = path.join(APPDATA, OUTPUT, "latest.json");

const payload = {
  latest: Number(VERSION),
  updated: Date.now(),
};

fs.writeFileSync(latestJsonOutput, JSON.stringify(payload), "utf8");
console.log(`Wrote ${latestJsonOutput}:`, payload);

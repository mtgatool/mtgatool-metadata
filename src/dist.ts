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
  /**
   * Which database formats this release publishes, as
   * `<lang>-database.<format>` release assets.
   *
   * Additive, and absent on every release before SQLite existed — so a missing
   * field means JSON only. A client that prefers SQLite can read this instead
   * of probing for a 404 against an older release.
   */
  formats: ["json", "sqlite"],
};

fs.writeFileSync(latestJsonOutput, JSON.stringify(payload), "utf8");
console.log(`Wrote ${latestJsonOutput}:`, payload);

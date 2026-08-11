/**
 * Sync formats.json from the newest live GetFormats snapshot.
 *
 * formats.json is a snapshot of Arena's GetFormats response, which is not in
 * any downloadable asset — only the game client ever sees it. mtgatool-desktop
 * clients normalize the response (the scripts/update-formats.js rules: enums
 * spelled out, empty collections materialized, formats sorted by name) and
 * upload it to the `formats_snapshots` table keyed by the sha256 of the
 * normalized JSON, so one row is one distinct formats table. This script pulls
 * the newest row and, when it differs from formats.json, rewrites the file —
 * the auto-update workflow's existing diff/test/release steps do the rest.
 *
 * updateSets' mirror heuristic still runs afterwards as the fallback for sets
 * that reach Arena's card data before any client has uploaded a snapshot
 * containing them; its inserts skip codes the snapshot already brought in.
 *
 * Snapshots are uploaded by clients, so nothing is trusted blindly: a
 * snapshot must look like a real formats table (see validateSnapshot) or the
 * run fails loudly instead of committing it.
 *
 * Exit codes mirror updateSets: 0 = synced or already current; 1 = the
 * newest snapshot is malformed and needs eyes.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// The same public project the desktop app talks to; the key is the anon
// (publishable) key every shipped client carries.
const SUPABASE_URL = "https://decenyvqkbvydrrolwpk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9CgHq0DZWlYYxjH7ZDLeOw_zk4EKYKu";

const FORMATS_PATH = path.resolve(process.cwd(), "formats.json");

interface Snapshot {
  Formats: {
    name: string;
    legalSets?: string[];
    FormatType?: string;
  }[];
  FormatGroups: { GroupName: string; FormatNames: string[] }[];
}

/**
 * Does this look like a genuine Arena formats table? Cheap structural checks
 * that a hostile or truncated upload would fail: the real table has well over
 * a hundred formats, always including the evergreen ones, and every entry is
 * a named format whose set lists are string arrays.
 */
export function validateSnapshot(snapshot: unknown): string | null {
  const s = snapshot as Snapshot;
  if (!s || !Array.isArray(s.Formats)) return "Formats is not an array";
  if (s.Formats.length < 100) {
    return `only ${s.Formats.length} formats (a real table has 100+)`;
  }
  if (!Array.isArray(s.FormatGroups)) return "FormatGroups is not an array";

  const names = new Set<string>();
  for (const f of s.Formats) {
    if (!f || typeof f.name !== "string" || f.name === "") {
      return "a format has no name";
    }
    names.add(f.name);
    for (const key of ["legalSets", "filterSets"] as const) {
      const list = (f as Record<string, unknown>)[key];
      if (list !== undefined) {
        if (!Array.isArray(list) || list.some((c) => typeof c !== "string")) {
          return `${f.name}.${key} is not a string array`;
        }
      }
    }
  }

  const evergreens = ["Standard", "Historic", "Alchemy", "TraditionalStandard"];
  for (const evergreen of evergreens) {
    if (!names.has(evergreen)) return `missing the ${evergreen} format`;
  }
  const standard = s.Formats.find((f) => f.name === "Standard");
  if (!standard?.legalSets || standard.legalSets.length < 5) {
    return "Standard has fewer than 5 legal sets";
  }
  return null;
}

/** Order-insensitive deep equality, so a pure key-order difference between
 * the file and a snapshot does not trigger a release. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (!deepEqual(ka, kb)) return false;
    return ka.every((k) =>
      deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    );
  }
  return false;
}

async function fetchLatestSnapshot(): Promise<{
  hash: string;
  formats: unknown;
  created_at: string;
} | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/formats_snapshots` +
    `?select=hash,formats,created_at&order=created_at.desc&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`formats_snapshots fetch failed: ${res.status}`);
  }
  const rows = (await res.json()) as {
    hash: string;
    formats: unknown;
    created_at: string;
  }[];
  return rows[0] ?? null;
}

async function main(): Promise<void> {
  const row = await fetchLatestSnapshot();
  if (!row) {
    console.log("No live formats snapshot uploaded yet; nothing to sync.");
    return;
  }

  const problem = validateSnapshot(row.formats);
  if (problem) {
    console.error(
      `Newest snapshot ${row.hash} (${row.created_at}) looks wrong: ${problem}`
    );
    process.exit(1);
  }

  const current = JSON.parse(fs.readFileSync(FORMATS_PATH, "utf8"));
  if (deepEqual(current, row.formats)) {
    console.log(
      `formats.json already matches snapshot ${row.hash.slice(0, 12)} ` +
        `(${row.created_at}).`
    );
    return;
  }

  fs.writeFileSync(
    FORMATS_PATH,
    `${JSON.stringify(row.formats, null, 2)}\n`
  );
  execSync("npx prettier --write formats.json", { stdio: "inherit" });
  console.log(
    `formats.json synced from snapshot ${row.hash.slice(0, 12)} ` +
      `(${row.created_at}).`
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

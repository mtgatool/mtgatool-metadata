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
 * Snapshots are uploaded by clients, so nothing is trusted blindly:
 * - a snapshot is only adopted once QUORUM distinct accounts have attested
 *   to its hash (each attestation carries that account's own copy of the
 *   content, verified against the hash on the way in — see
 *   fetchQuorumSnapshot for why that matters);
 * - and it must look like a real formats table (see validateSnapshot) or the
 *   run fails loudly instead of committing it.
 *
 * Exit codes mirror updateSets: 0 = synced or already current; 1 = the
 * chosen snapshot is malformed or gamed and needs eyes.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";

// The same public project the desktop app talks to; the key is the anon
// (publishable) key every shipped client carries.
const SUPABASE_URL = "https://decenyvqkbvydrrolwpk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9CgHq0DZWlYYxjH7ZDLeOw_zk4EKYKu";

// Distinct accounts that must have attested a snapshot before it is adopted.
// A real formats change clears this within hours of Arena's rollout (every
// active client sees the same table); an attacker has to fabricate this many
// accounts.
const QUORUM = 3;

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
  for (const g of s.FormatGroups) {
    if (!g || typeof g.GroupName !== "string" || g.GroupName === "") {
      return "a format group has no name";
    }
    if (
      !Array.isArray(g.FormatNames) ||
      g.FormatNames.some((n) => typeof n !== "string")
    ) {
      return `group ${g.GroupName}.FormatNames is not a string array`;
    }
  }

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

// An unattended cron must never hang on a dead connection until the job
// timeout. (AbortController + setTimeout rather than AbortSignal.timeout —
// this project's TypeScript does not know the latter.)
const FETCH_TIMEOUT_MS = 30_000;

async function rest(pathAndQuery: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(
        `${pathAndQuery.split("?")[0]} fetch failed: ${res.status}`
      );
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** sha256 of a snapshot exactly as the uploading client hashed it. */
export function contentHash(formats: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(formats))
    .digest("hex");
}

/**
 * The newest snapshot enough distinct accounts have attested to — where an
 * attestation only counts once its content is verified to hash to the claimed
 * key. The view's `uploaders` is merely the shortlist filter; the quorum that
 * matters is counted over hash-valid rows, one content fetch per attester
 * (cheapest-first bounded scan: stop as soon as QUORUM verify). This is what
 * makes junk attestations of a real hash pure waste — they can neither poison
 * the content nor crowd valid rows out of a fixed fetch window.
 */
async function fetchQuorumSnapshot(): Promise<{
  hash: string;
  formats: unknown;
  uploaders: number;
  first_seen: string;
} | null> {
  const quorum = (await rest(
    `formats_snapshot_quorum?select=hash,uploaders,first_seen` +
      `&uploaders=gte.${QUORUM}&order=first_seen.desc&limit=1`
  )) as { hash: string; uploaders: number; first_seen: string }[];
  const chosen = quorum[0];
  if (!chosen) return null;

  // Every attester of the chosen hash — identities only, no content yet.
  const attesters = (await rest(
    `formats_snapshots?select=uploaded_by&hash=eq.${chosen.hash}` +
      `&order=created_at.asc`
  )) as { uploaded_by: string }[];

  let verifiedCount = 0;
  let formats: unknown = null;
  for (const { uploaded_by } of attesters) {
    const rows = (await rest(
      `formats_snapshots?select=formats&hash=eq.${chosen.hash}` +
        `&uploaded_by=eq.${uploaded_by}&limit=1`
    )) as { formats: unknown }[];
    const content = rows[0]?.formats;
    if (content !== undefined && contentHash(content) === chosen.hash) {
      verifiedCount += 1;
      if (formats === null) formats = content;
      if (verifiedCount >= QUORUM) break;
    }
  }

  if (verifiedCount < QUORUM) {
    // Enough accounts claimed this hash to clear the view's filter, but
    // fewer than QUORUM of them carry content that actually hashes to it —
    // that is not a glitch, someone is gaming the table. Needs eyes.
    throw new Error(
      `Snapshot ${chosen.hash}: only ${verifiedCount} of ` +
        `${attesters.length} attestations carry content matching the hash ` +
        `(need ${QUORUM})`
    );
  }
  return { ...chosen, formats };
}

async function main(): Promise<void> {
  const row = await fetchQuorumSnapshot();
  if (!row) {
    console.log(
      `No snapshot with ${QUORUM}+ attesting accounts yet; nothing to sync.`
    );
    return;
  }

  const problem = validateSnapshot(row.formats);
  if (problem) {
    console.error(
      `Snapshot ${row.hash} (${row.uploaders} uploaders, first seen ` +
        `${row.first_seen}) looks wrong: ${problem}`
    );
    process.exit(1);
  }

  const current = JSON.parse(fs.readFileSync(FORMATS_PATH, "utf8"));
  if (deepEqual(current, row.formats)) {
    console.log(
      `formats.json already matches snapshot ${row.hash.slice(0, 12)} ` +
        `(${row.uploaders} uploaders).`
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
      `(${row.uploaders} uploaders, first seen ${row.first_seen}).`
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

/**
 * Verify every Arena set's Scryfall mapping by resolving a real card through it.
 *
 * Checking that a set code merely EXISTS is useless here: "ana", "j21" and "g18"
 * are all valid Scryfall sets that simply do not hold the cards Arena files
 * under them. ANB pointed at "ana" for years and only surfaced when someone
 * noticed a deck tile with no art; J21 was worse, resolving every card to a
 * confidently WRONG one, which nobody reports as a bug. So this takes a real
 * card from each set and checks the name that comes back.
 *
 * Cards come from the last published metadata, mappings from SETS_DATA in this
 * working tree — so a PR editing the mapping is validated without regenerating
 * from Arena's manifest.
 *
 * Results are cached in set-mappings.json (committed, like set-icons.json), so a
 * run that changes no mapping makes no requests. Only a REGRESSION fails the
 * build: a set that used to resolve and no longer does. Sets that have never had
 * a Scryfall code are reported and ignored — the client falls back to a by-name
 * lookup for those by design.
 */
import fs from "fs";
import path from "path";

import { DIGITAL_SETS, SETS_DATA } from "./metadata-constants";

const CACHE_PATH = path.resolve(process.cwd(), "set-mappings.json");

const METADATA_URL =
  "https://decenyvqkbvydrrolwpk.supabase.co/storage/v1/object/public/metadata/en-database.json.gz";

// Scryfall rejects (403) requests without a descriptive User-Agent and Accept
// header — the same lesson httpGetTextAsync records.
const HEADERS = {
  "User-Agent":
    "mtgatool-metadata/1.0 (+https://github.com/mtgatool/mtgatool-metadata)",
  Accept: "*/*",
};

// Their guidance is 50-100ms between requests; sit outside it.
const THROTTLE_MS = 120;

interface CachedMapping {
  scryfall: string;
  /** how it was verified: by collector number, or by name for digital sets */
  via: "collector" | "name";
  checkedAt: string;
}

export interface SetProblem {
  arenaSet: string;
  setName: string;
  code: string;
  kind: string;
  detail: string;
  /** true when this set resolved in the committed baseline and no longer does */
  regression: boolean;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/** Compare loosely: casing, punctuation and the back half of a DFC don't matter. */
function sameCard(a: string, b: string): boolean {
  const norm = (s: string): string =>
    String(s || "")
      .split(" // ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  return norm(a) === norm(b);
}

function loadCache(): Record<string, CachedMapping> {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.log(`Could not read set-mappings cache: ${String(e)}`);
  }
  return {};
}

function saveCache(cache: Record<string, CachedMapping>): void {
  const ordered: Record<string, CachedMapping> = {};
  Object.keys(cache)
    .sort()
    .forEach((k) => {
      ordered[k] = cache[k];
    });
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
}

async function scryfall(url: string): Promise<any | null> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.json();
}

async function fetchPublishedCards(): Promise<any[]> {
  const res = await fetch(METADATA_URL, { headers: HEADERS });
  if (!res.ok) throw new Error(`metadata download failed: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const { gunzipSync } = await import("zlib");
  const db = JSON.parse(gunzipSync(Buffer.from(buf)).toString("utf8"));
  return Object.values(db.cards);
}

export default async function auditSetMappings(): Promise<SetProblem[]> {
  const cards = await fetchPublishedCards();
  const cache = loadCache();
  const problems: SetProblem[] = [];

  // One representative card per Arena set. Tokens and cards with no collector
  // number are useless as probes.
  const bySet = new Map<string, any[]>();
  cards.forEach((c: any) => {
    if (!c || !c.Name || c.IsToken || !c.Set) return;
    if (!c.CollectorNumber || String(c.CollectorNumber) === "0") return;
    if (!bySet.has(c.Set)) bySet.set(c.Set, []);
    (bySet.get(c.Set) as any[]).push(c);
  });

  // SETS_DATA is keyed by set name; index it by Arena code the way the app does.
  const byCode = new Map<string, { name: string; scryfall: string }>();
  Object.entries(SETS_DATA).forEach(([name, data]: [string, any]) => {
    if (data && data.code) {
      byCode.set(String(data.code).toUpperCase(), {
        name,
        scryfall: data.scryfall,
      });
    }
  });

  // Array.from, not spread: this project targets pre-ES2015, where spreading a
  // Map iterator needs --downlevelIteration.
  const arenaSets = Array.from(bySet.keys()).sort();
  console.log(`Auditing ${arenaSets.length} Arena sets`);

  let requests = 0;
  let cached = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const arenaSet of arenaSets) {
    const mapped = byCode.get(arenaSet.toUpperCase());
    const code = mapped && mapped.scryfall;
    const setName = mapped ? mapped.name : "(unmapped)";
    const wasOk = !!cache[arenaSet];

    if (!code || code === "default") {
      // No mapping at all: the client resolves these by name with no set
      // constraint. Expected for Arena-only sets, so never a failure — but a
      // set that USED to be mapped losing its code is a regression.
      problems.push({
        arenaSet,
        setName,
        code: code || "(none)",
        kind: "no scryfall code",
        detail: "client falls back to a by-name lookup",
        regression: wasOk,
      });
      continue;
    }

    // Unchanged mapping already verified — skip the network entirely.
    if (cache[arenaSet] && cache[arenaSet].scryfall === code) {
      cached += 1;
      continue;
    }

    // Digital sets are resolved by name in the client, so verifying their
    // collector numbers would fail by design. Check the name path instead.
    const viaName = DIGITAL_SETS.includes(setName as never);
    const probes = (bySet.get(arenaSet) as any[]).slice(0, 3);
    let ok = false;
    let last = "";

    // eslint-disable-next-line no-restricted-syntax
    for (const probe of probes) {
      const url = viaName
        ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
            probe.Name
          )}&set=${code}`
        : `https://api.scryfall.com/cards/${code}/${encodeURIComponent(
            probe.CollectorNumber
          )}`;
      // eslint-disable-next-line no-await-in-loop
      const card = await scryfall(url);
      requests += 1;
      // eslint-disable-next-line no-await-in-loop
      await sleep(THROTTLE_MS);

      if (card && sameCard(card.name, probe.Name)) {
        ok = true;
        break;
      }
      last = card
        ? `${code} gives "${card.name}" where Arena says "${probe.Name}"`
        : `${code}/${probe.CollectorNumber} not found (${probe.Name})`;
    }

    if (ok) {
      cache[arenaSet] = {
        scryfall: code,
        via: viaName ? "name" : "collector",
        checkedAt: new Date().toISOString().slice(0, 10),
      };
    } else {
      problems.push({
        arenaSet,
        setName,
        code,
        kind: viaName ? "by-name lookup fails" : "wrong set or numbering",
        detail: last,
        regression: wasOk,
      });
      // The entry is deliberately LEFT IN PLACE. The cache is a last-known-good
      // baseline, and dropping a set here would erase the very record that makes
      // this a regression — the next run would see no prior success, report
      // nothing and exit 0, so a retry would turn a red build green.
    }
  }

  const unmapped = problems.filter((p) => p.kind === "no scryfall code");
  const broken = problems.filter((p) => p.kind !== "no scryfall code");
  const regressions = problems.filter((p) => p.regression);

  console.log(
    `${requests} lookups, ${cached} from cache, ${unmapped.length} unmapped (by design)`
  );

  if (broken.length) {
    console.log(`\n${broken.length} set(s) not resolving:`);
    broken.forEach((p) => {
      console.log(`  ${p.arenaSet} -> ${p.code}  ${p.kind}`);
      console.log(`     ${p.setName}: ${p.detail}`);
    });
  }

  if (regressions.length) {
    console.log(
      `\n${regressions.length} REGRESSION(S) — these used to resolve:`
    );
    regressions.forEach((p) => console.log(`  ${p.arenaSet} -> ${p.code}`));
    // Leave the baseline untouched on a regression, so the failure is
    // reproducible and a re-run cannot quietly bless the broken state.
    console.log("Baseline left unchanged.");
    return problems;
  }

  saveCache(cache);
  return problems;
}

// Run directly: `node dist/auditSetMappings.js`
if (require.main === module) {
  auditSetMappings()
    .then((problems) => {
      // Only regressions break the build. A set that has never resolved is a
      // known gap, not a reason to block every future release.
      const regressions = problems.filter((p) => p.regression);
      process.exit(regressions.length ? 1 : 0);
    })
    .catch((e) => {
      console.error(`Audit failed to run: ${String(e)}`);
      process.exit(1);
    });
}

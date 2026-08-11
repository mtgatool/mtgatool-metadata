/**
 * Discover sets Arena's card database has that this repo doesn't, and add them.
 *
 * This is the front half of a release that used to be done by hand: diff
 * Arena's data against sets/, resolve anything new through Scryfall (name,
 * canonical code, release date, icon), write its sets/<code>.json, and slot it
 * into formats.json. The back half — version bump, tag, publish — is the
 * auto-update workflow's job, and only happens when this script leaves changes
 * behind and exits 0.
 *
 * formats.json is a snapshot of Arena's GetFormats response, which is not in
 * any downloadable asset — so new sets are slotted in by MIRRORING the last
 * set of the same kind, the same way it was done by hand:
 *
 * - a main set (Scryfall set_type expansion/core) goes wherever the newest
 *   Standard-legal set appears: Standard and its variants plus the eternal
 *   formats;
 * - a companion set (Eternal/Commander/bonus sheets — anything else) goes
 *   wherever the newest companion appears: the eternal formats only;
 * - an Alchemy set (set_type alchemy) is inserted, in Arena's underscore
 *   spelling (Y26_SOS), after the newest same-year Alchemy code per list.
 *
 * Lists shorter than five sets never receive anything: those are the set-pair
 * and set-specific formats (FDNMSH, the per-set draft formats), where a new
 * set does not belong. The mirror is a heuristic — a banned-on-arrival card or
 * a rotation it cannot know about — but it is exactly what a maintainer would
 * write, and the mapping audit plus sets test gate anything it gets wrong.
 *
 * Exit codes: 0 with changes = ready to release; 0 without = up to date;
 * 1 = something needs eyes (unresolvable set, name collision). The cron just
 * runs it again tomorrow — Scryfall usually lags Arena's data by hours, not
 * days, around a release.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { getArenaVersion, getManifestFiles } from "./manifest-parser";
import { APPDATA, EXTERNAL, SETS_DATA } from "./metadata-constants";
import { readSetFiles, writeSetFile, SetFile } from "./setFiles";
import { whiteFill } from "./getSetIcons";
import readExternalJson from "./readExternalJson";
import { Card } from "./types/jsons-data";

// Scryfall rejects (403) requests without a descriptive User-Agent.
const HEADERS = {
  "User-Agent":
    "mtgatool-metadata/1.0 (+https://github.com/mtgatool/mtgatool-metadata)",
  Accept: "*/*",
};
const THROTTLE_MS = 120;

/** Arena-only pseudo-sets that never get a metadata entry. */
const IGNORED_CODES = ["ArenaSUP", "WC", ""];

const FORMATS_PATH = path.resolve(process.cwd(), "formats.json");

interface ScryfallSet {
  code: string;
  arena_code?: string;
  name: string;
  released_at?: string;
  set_type: string;
  parent_set_code?: string;
  icon_svg_uri?: string;
}

type SetClass = "main" | "alchemy" | "companion";

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/** Every set code Arena's card database mentions (same logic as sets.test). */
function arenaCodesFromCards(): string[] {
  const cards = readExternalJson("cards.json") as Card[];
  const codes = new Set<string>();
  cards.forEach((card) => {
    // Alchemy cards report a bare rotation year ("Y26") as their expansion;
    // the set they belong to is the digital release ("Y26-SOS").
    const code = /^Y\d{2}$/.test(card.ExpansionCode)
      ? card.DigitalReleaseSet
      : card.ExpansionCode;
    if (code && !IGNORED_CODES.includes(code)) codes.add(code);
  });
  return Array.from(codes).sort();
}

async function scryfall(url: string): Promise<ScryfallSet | null> {
  const res = await fetch(url, { headers: HEADERS });
  await sleep(THROTTLE_MS);
  if (!res.ok) return null;
  return (await res.json()) as ScryfallSet;
}

/**
 * Resolve an Arena code on Scryfall. Scryfall aliases Arena codes (sets/dar
 * answers with dom), and Alchemy sets ("Y26-SOS") live under y+parent
 * ("ysos") — so try the alias first, then the alchemy spelling.
 */
async function resolveOnScryfall(code: string): Promise<ScryfallSet | null> {
  const yMatch = /^Y\d{2}-(\w+)$/.exec(code);
  const candidates = yMatch
    ? [`y${yMatch[1].toLowerCase()}`, code.toLowerCase()]
    : [code.toLowerCase()];

  // eslint-disable-next-line no-restricted-syntax
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const set = await scryfall(`https://api.scryfall.com/sets/${candidate}`);
    if (!set) continue;
    // Make sure the alias actually points here: either Scryfall names this
    // exact Arena code, or the code IS Scryfall's code. Without this, a bogus
    // Arena code that happens to be a valid Scryfall set would map wrong —
    // the ana/j21 lesson from the mapping audit.
    const arena = (set.arena_code || "").toLowerCase();
    if (arena === code.toLowerCase() || set.code === candidate) return set;
  }
  return null;
}

function classify(set: ScryfallSet): SetClass {
  if (set.set_type === "alchemy") return "alchemy";
  if (set.set_type === "expansion" || set.set_type === "core") return "main";
  return "companion";
}

interface FormatEntry {
  name: string;
  legalSets?: string[];
  filterSets?: string[];
}

/** Insert `code` after `anchor` in every list that carries the anchor. */
function mirrorInsert(
  formats: FormatEntry[],
  anchor: string,
  code: string
): number {
  let inserted = 0;
  formats.forEach((format) => {
    [format.legalSets, format.filterSets].forEach((list) => {
      if (!Array.isArray(list) || list.length < 5) return;
      if (!list.includes(anchor) || list.includes(code)) return;
      list.splice(list.indexOf(anchor) + 1, 0, code);
      inserted += 1;
    });
  });
  return inserted;
}

function insertIntoFormats(code: string, klass: SetClass): number {
  const data = JSON.parse(fs.readFileSync(FORMATS_PATH, "utf8"));
  const formats: FormatEntry[] = data.Formats;
  const byName = (n: string): FormatEntry | undefined =>
    formats.find((f) => f.name === n);
  const standard = byName("Standard")?.legalSets || [];
  const historic = byName("Historic")?.legalSets || [];

  let inserted = 0;
  if (klass === "main") {
    // The newest main set is, by construction, the last entry of Standard.
    const anchor = standard[standard.length - 1];
    inserted = mirrorInsert(formats, anchor, code);
  } else if (klass === "companion") {
    // The newest set that is Historic-legal but not Standard-legal.
    const anchor = readSetFiles()
      .filter(
        (s) =>
          historic.includes(s.code) &&
          !standard.includes(s.code) &&
          !/^Y\d{2}/.test(s.code)
      )
      .sort((a, b) => (a.release < b.release ? -1 : 1))
      .pop()?.code;
    if (anchor) inserted = mirrorInsert(formats, anchor, code);
  } else {
    // Arena spells Alchemy sets with an underscore in format lists. Slot in
    // after the newest same-year Alchemy code; a brand-new year has no
    // precedent to mirror, so it falls out as inserted=0 and needs eyes.
    const arenaCode = code.replace("-", "_");
    const year = arenaCode.slice(0, 3);
    formats.forEach((format) => {
      [format.legalSets, format.filterSets].forEach((list) => {
        if (!Array.isArray(list) || list.length < 5) return;
        if (list.includes(arenaCode)) return;
        const anchors = list.filter((c) => c.startsWith(`${year}_`));
        const anchor = anchors[anchors.length - 1];
        if (!anchor) return;
        list.splice(list.indexOf(anchor) + 1, 0, arenaCode);
        inserted += 1;
      });
    });
  }

  if (inserted) {
    fs.writeFileSync(FORMATS_PATH, `${JSON.stringify(data, null, 2)}\n`);
    execSync("npx prettier --write formats.json", { stdio: "inherit" });
  }
  return inserted;
}

export default async function updateSets(): Promise<number> {
  // Reuse Arena data a previous step (setup/build) already downloaded;
  // fetch it ourselves only when running standalone.
  if (!fs.existsSync(path.join(APPDATA, EXTERNAL, "cards.json"))) {
    console.log("No external data; downloading Arena manifest.");
    await getArenaVersion("Live").then(getManifestFiles);
  }

  const known = new Set(
    Object.values(SETS_DATA).map((s) => String(s.arenacode))
  );
  const knownNames = new Set(Object.keys(SETS_DATA));
  const missing = arenaCodesFromCards().filter((c) => !known.has(c));

  if (!missing.length) {
    console.log("Set data is up to date with Arena's card database.");
    return 0;
  }
  console.log(`New Arena set code(s): ${missing.join(", ")}`);

  let failures = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const code of missing) {
    // eslint-disable-next-line no-await-in-loop
    const scry = await resolveOnScryfall(code);
    if (!scry) {
      // Scryfall usually trails Arena's data drop by a few hours; tomorrow's
      // run will pick it up. Failing keeps the state honest — without the
      // entry, sets.test would fail the release anyway.
      console.log(`  ${code}: not on Scryfall yet, skipping this run`);
      failures += 1;
      continue;
    }
    if (knownNames.has(scry.name)) {
      console.log(`  ${code}: name "${scry.name}" already exists — needs eyes`);
      failures += 1;
      continue;
    }

    const file: SetFile = {
      name: scry.name,
      scryfall: scry.code,
      code,
      arenacode: code,
      tile: 67003,
      release: scry.released_at || "",
      collation: -1, // real booster ids resolve from Arena's data at build time
    };
    if (scry.icon_svg_uri) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(scry.icon_svg_uri, { headers: HEADERS });
      if (res.ok) {
        // eslint-disable-next-line no-await-in-loop
        const svg = await res.text();
        file.svg = Buffer.from(whiteFill(svg)).toString("base64");
      }
    }
    writeSetFile(file);

    const klass = classify(scry);
    const inserted = insertIntoFormats(code, klass);
    console.log(
      `  ${code}: "${scry.name}" (${scry.set_type} -> ${klass}), ` +
        `${inserted} format list(s)`
    );
    if (!inserted) {
      console.log(`  ${code}: no format list took it — needs eyes`);
      failures += 1;
    }
  }

  return failures ? 1 : 0;
}

// Run directly: `node dist/updateSets.js`
if (require.main === module) {
  updateSets()
    .then((exitCode) => process.exit(exitCode))
    .catch((e) => {
      console.error(`Set update failed to run: ${String(e)}`);
      process.exit(1);
    });
}

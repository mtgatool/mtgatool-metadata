#!/usr/bin/env node
/**
 * Check a generated SQLite database against the client that has to consume it.
 *
 * Every derived column in `cards` is a port of a helper in mtgatool-desktop's
 * `src/cards-worker/`. A port that drifts is worse than no port at all: the
 * collection would quietly filter and sort on stale values with nothing
 * failing. So this runs the desktop's real `getCollectionData` over the same
 * database.json the SQLite was built from and compares every field, per card.
 *
 * The desktop repo has to be checked out and its worker compiled:
 *
 *   cd ../mtgatool-desktop && npx tsc -p cards-worker-tsconfig.json
 *   node scripts/verify-against-worker.js <db.sqlite> [desktop-repo] [database.json]
 *
 * Exits non-zero on any mismatch.
 */
const fs = require("fs");
const path = require("path");

const Database = require("better-sqlite3");

const [, , sqliteArg, desktopArg, jsonArg] = process.argv;

if (!sqliteArg) {
  console.error(
    "Usage: node scripts/verify-against-worker.js <db.sqlite> [desktop-repo] [database.json]"
  );
  process.exit(1);
}

const sqlitePath = path.resolve(sqliteArg);
const desktop = path.resolve(
  desktopArg || path.join(__dirname, "..", "..", "mtgatool-desktop")
);
const jsonPath = path.resolve(
  jsonArg || path.join(desktop, "src/assets/resources/database.json")
);

const workerPath = path.join(
  desktop,
  "dist-cards-worker/cards-worker/getCollectionData.js"
);

[sqlitePath, jsonPath, workerPath].forEach((p) => {
  if (!fs.existsSync(p)) {
    console.error(`Missing: ${p}`);
    if (p === workerPath) {
      console.error(
        "Compile it first: cd ../mtgatool-desktop && npx tsc -p cards-worker-tsconfig.json"
      );
    }
    process.exit(1);
  }
});

const getCollectionData = require(workerPath).default;
const dbJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

console.log(`worker:  ${workerPath}`);
console.log(`json:    ${jsonPath}`);
console.log(`sqlite:  ${sqlitePath}\n`);

console.log("Running the live cards worker …");
const started = Date.now();
const live = getCollectionData(
  { prevCards: {}, cards: {} },
  Object.values(dbJson.cards),
  dbJson.cards,
  dbJson.setNames,
  dbJson.sets
);
console.log(
  `  ${live.length} rows in ${((Date.now() - started) / 1000).toFixed(1)}s`
);

const db = new Database(sqlitePath, { readonly: true });

const formats = db.prepare("SELECT id, name, word, mask FROM formats").all();
const rows = db
  .prepare(
    `SELECT grpid, titleid, full_name, full_type, artist, cid, color_bits,
            color_sort, rarity_val, rank_sort, craftable, booster,
            legal_0, legal_1, legal_2, legal_3, legal_4, legal_5
       FROM cards WHERE listable = 1`
  )
  .all();

const aliasesByGrp = {};
db.prepare("SELECT grpid, alias FROM card_set_aliases")
  .all()
  .forEach((r) => {
    (aliasesByGrp[r.grpid] = aliasesByGrp[r.grpid] || []).push(r.alias);
  });

const bannedByTitle = {};
const suspendedByTitle = {};
db.prepare(
  `SELECT f.name AS format, fc.title_id, fc.kind
     FROM format_cards fc JOIN formats f ON f.id = fc.format_id
    WHERE fc.kind IN ('banned', 'suspended')`
)
  .all()
  .forEach((r) => {
    const bag = r.kind === "banned" ? bannedByTitle : suspendedByTitle;
    (bag[r.title_id] = bag[r.title_id] || []).push(r.format);
  });

function decodeLegal(row) {
  const words = [
    row.legal_0,
    row.legal_1,
    row.legal_2,
    row.legal_3,
    row.legal_4,
    row.legal_5,
  ];
  return formats
    .filter((f) => (words[f.word] & f.mask) !== 0)
    .map((f) => f.name);
}

const byGrp = {};
rows.forEach((r) => {
  byGrp[r.grpid] = r;
});

const sorted = (a) => a.slice().sort();
const eqArr = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

const mismatches = {};
let checked = 0;
let missing = 0;

function note(field, grpid, expected, got) {
  if (!mismatches[field]) mismatches[field] = { count: 0, sample: [] };
  mismatches[field].count += 1;
  if (mismatches[field].sample.length < 3) {
    mismatches[field].sample.push({ grpid, expected, got });
  }
}

live.forEach((card) => {
  const row = byGrp[card.id];
  if (!row) {
    missing += 1;
    return;
  }
  checked += 1;

  const scalars = [
    ["fullName", card.fullName, row.full_name],
    ["fullType", card.fullType, row.full_type],
    ["artist", card.artist, row.artist],
    ["colors", card.colors, row.color_bits],
    ["colorSortVal", card.colorSortVal, row.color_sort],
    ["rarityVal", card.rarityVal, row.rarity_val],
    ["rankSortVal", card.rankSortVal, row.rank_sort],
    ["craftable", !!card.craftable, !!row.craftable],
    ["booster", !!card.booster, !!row.booster],
  ];
  scalars.forEach(([field, expected, got]) => {
    if (expected !== got) note(field, card.id, expected, got);
  });

  // The client keeps NaN for a non-numeric collector number; SQLite stores NULL.
  const gotCid = row.cid === null ? NaN : row.cid;
  const cidSame = Number.isNaN(card.cid)
    ? Number.isNaN(gotCid)
    : card.cid === gotCid;
  if (!cidSame) note("cid", card.id, card.cid, gotCid);

  const pairs = [
    ["setCode", card.setCode, aliasesByGrp[card.id] || []],
    ["format", card.format, decodeLegal(row)],
    ["banned", card.banned, bannedByTitle[row.titleid] || []],
    ["suspended", card.suspended, suspendedByTitle[row.titleid] || []],
  ];
  pairs.forEach(([field, expected, got]) => {
    if (!eqArr(expected, got)) note(field, card.id, expected, got);
  });
});

console.log(`\nlive rows: ${live.length}   sqlite listable rows: ${rows.length}`);
console.log(`compared:  ${checked}   missing from sqlite: ${missing}`);

const fields = Object.keys(mismatches);
if (fields.length === 0 && missing === 0 && live.length === rows.length) {
  console.log("\nAll fields match.");
} else {
  console.log("\nMISMATCHES:");
  fields.forEach((field) => {
    const m = mismatches[field];
    console.log(`  ${field}: ${m.count}`);
    m.sample.forEach((s) =>
      console.log(
        `      grpid ${s.grpid}\n` +
          `        live:   ${JSON.stringify(s.expected)}\n` +
          `        sqlite: ${JSON.stringify(s.got)}`
      )
    );
  });
  process.exitCode = 1;
}

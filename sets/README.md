# Set data

One JSON file per Arena set, named by its Arena code lowercased
(`hob.json`; the unnamed default set is `default.json`). Loaded at build
time by `src/metadata-constants.ts` into `SETS_DATA` / `DIGITAL_SETS`,
and written by `src/updateSets.ts` (the automated set discovery) and
`src/getSetIcons.ts` (icon backfill).

## Schema

```jsonc
{
  "name": "The Hobbit",      // display name; the SETS_DATA key
  "scryfall": "hob",         // Scryfall set code card lookups resolve through
  "code": "HOB",             // the code the rest of the pipeline keys on
  "arenacode": "HOB",        // what Arena's card database calls it (DAR vs DOM)
  "tile": 67003,             // legacy tile art id; 67003 for everything recent
  "release": "2026-08-14",   // refreshed from Scryfall when icons resolve
  "collation": -1,           // see below
  "svg": "<base64>",         // white-filled set symbol, fetched from Scryfall
  "byName": true             // optional; see below
}
```

## collation

The booster id Arena tags packs with. **Leave it -1 for new sets**: real
ids are derived at build time from Arena's own `Booster.json` (see
`src/getBoosterCollations.ts`), which is what stopped the list going
stale. A made-up value would be matched against the player's booster
inventory and light up booster math for sets that cannot be counted.
Bonus sheets deliberately share their parent set's id — they are opened
inside another set's packs.

## byName

Set it when the client must look cards up on Scryfall **by name within
the set** instead of by collector number — because Arena's numbering does
not correspond to Scryfall's, so `/cards/{set}/{number}` 404s or, worse,
resolves to a confidently wrong card (J21 resolved every card wrong for
years; "Through the Omenpaths" returned Aunt May where Arena has Zora,
Spider Fancier). Alchemy and anthology sets are the usual case. The
mapping audit (`src/auditSetMappings.ts`) is what catches these.

Notable cases preserved from the old inline comments:

- **ANA** — Scryfall splits Arena's ANA in two: `ana` is the 46-card
  play-experience set, while the cards Arena reports live in `oana`
  (Arena New Player Experience Cards). Numbering lines up with neither,
  hence `byName`.
- **ANB** — points at Scryfall's `anb` (Arena Beginner Set, 120 cards),
  distinct from `ana` above. Arena's collector numbers line up with
  `anb` exactly; pointing at `ana` 404'd every card in the set.
- **PRM** (Magic Online Promos) — has a card Scryfall does not list
  under `prm` at all, so it stays partly unresolved either way.

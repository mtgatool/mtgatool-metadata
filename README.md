[![Build Status](https://travis-ci.org/Manuel-777/MTG-Arena-Tool-Metadata.svg?branch=master)](https://travis-ci.org/Manuel-777/MTG-Arena-Tool-Metadata)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

<p align="center">
  <img width="200" height="200" src="https://github.com/Manuel-777/MTG-Arena-Tool-Metadata/raw/master/icon.png"><br>
  <b><h1>MTG Arena Tool Metadata Generator</h1></b>
</p>

A metadata generator for [MTG Arena Tool](https://github.com/Manuel-777/MTG-Arena-Tool).
Magic Cards database is downloaded from [Scryfall.com](http://scryfall.com), then put together using MTG Arena's cards data.

Designed to run automatically and upload for MTG Arena Tool, but anyone is free to try it and contribute!

# Automated releases

New Arena sets release themselves. A daily workflow
(`auto-update-sets.yml`) diffs Arena's card database against the per-set
files in [`sets/`](sets/README.md); when Arena ships something new it
resolves the set through Scryfall (name, code, release date, icon),
mirrors it into `formats.json` after the newest set of its kind, runs the
tests, bumps the version and pushes a `vN` tag — which triggers the
publish workflow like any by-hand release. A red run means either
Scryfall doesn't know the set yet (tomorrow's run retries) or something
genuinely needs eyes; nothing is committed on failure.

# API

Main Endpoint:

[https://mtgatool.com/api/database/](https://mtgatool.com/api/database/)

Current Version Info:

[https://mtgatool.com/api/database/latest/](https://mtgatool.com/api/database/latest/)

Multi language endpoints:

[https://mtgatool.com/api/database/latest/fr](https://mtgatool.com/api/database/latest/fr)  
[https://mtgatool.com/api/database/fr](https://mtgatool.com/api/database/fr)

Available languages:

`de, en, es, fr, it, ja, ko, pt, ru`
W

Anyone is free to use the database to feed their software or just for learning. If you do, please give credit to either me (Manuel Etchegaray) or MTG Arena Tool.

# SQLite output

Alongside `v<version>-<lang>-database.json`, the generator writes
`v<version>-<lang>-database.sqlite`: the same payload as a relational database,
with the per-card facts consumers used to derive at runtime resolved into
columns.

The point is that the JSON forces every consumer to hold the whole 26k-card
table in memory and recompute the same things over it. mtgatool-desktop was
holding several copies at once and re-deriving format legality, craftability,
booster membership, search keys and sort keys for every card on every
collection mount. Those are all build-time facts.

## Published assets

Each release publishes both formats, per language, under stable unversioned
names:

```
https://github.com/mtgatool/mtgatool-metadata/releases/latest/download/latest.json
https://github.com/mtgatool/mtgatool-metadata/releases/latest/download/en-database.json
https://github.com/mtgatool/mtgatool-metadata/releases/latest/download/en-database.sqlite
```

The JSON databases are the original published format and are not going
anywhere — this data is used outside mtgatool-desktop and removing them would
break anyone building on it. SQLite is additive.

`latest.json` carries `formats: ["json", "sqlite"]`. The field is absent on
every release made before SQLite existed, so a missing value means JSON only —
which is what a client should check rather than probing for a 404.

The same files are mirrored gzipped into a public Supabase Storage bucket,
because GitHub release assets send no CORS headers and browsers therefore
cannot fetch them directly.

## Building one without running the pipeline

The full run downloads Arena's manifest and the Scryfall bulk data. To iterate
on the schema, convert an existing metadata JSON instead — including the one
bundled in mtgatool-desktop:

```bash
npm run sqlite -- ../mtgatool-desktop/src/assets/resources/database.json out.sqlite
```

`MTGATOOL_SKIP_SQLITE=1` skips the SQLite step during a full `npm start`.

## Shape

- `cards` — a faithful translation of `DbCardDataV2`, plus derived columns
  (`full_name`, `full_type`, `artist`, `cid`, `color_bits`, `color_sort`,
  `rarity_val`, `rank_sort`, `listable`, `craftable`, `booster`).
- `sets`, `set_aliases`, `card_set_aliases` — set identity and every code a set
  or card can legitimately answer to. `collation` is `INTEGER | NULL` here;
  upstream it is `number | false`.
- `abilities`, `card_reprints`.
- `formats`, `format_sets`, `format_cards`, `format_card_quotas`,
  `format_groups` — **seeded** from `formats.json` in this repo's root.
- `cards.legal_0 … legal_5` — format legality as a bitmask, 30 bits per word;
  `formats.word` / `formats.mask` locate a format's bit. As a
  `card_formats(grpid, format_id)` table this was 1.68M rows and took the
  gzipped download from 2.9MB to 14.8MB. The `v_card_legal` view exposes it as
  rows anyway, for ad-hoc queries.

## Formats are seeded, and that is a real limitation

Formats are the one thing Arena does not publish: no `Formats` table in its
CardDatabase, no formats asset in the manifest. The only source is the
`GetFormats` response the client logs on launch, so `formats.json` here is a
snapshot — refresh it from mtgatool-desktop's
`src/assets/resources/formats.json` after running that repo's
`scripts/update-formats.js`.

A ban announcement therefore invalidates the seed before the next metadata
release does. `formats.source` marks rows as `'seed'` so a client can keep its
own GetFormats-derived rows and tell them apart — but anything a client writes
into this file is lost when a new release replaces it, so client-owned rows
need their own database, ATTACHed.

## Verifying a build

The derived columns are ports of helpers in mtgatool-desktop's
`src/cards-worker/`. A port that drifts fails silently, so compare a build
against the real client:

```bash
cd ../mtgatool-desktop && npx tsc -p cards-worker-tsconfig.json && cd -
node scripts/verify-against-worker.js out.sqlite
```

It runs the desktop's actual `getCollectionData` over the same JSON and diffs
every field of every card. Two known client bugs are reproduced deliberately so
this passes — both marked `BUG-COMPAT` in `src/sqlite/derive.ts`.

For more information see [LICENSE](./LICENSE.md)

## Contact
You can find me at any of the following media:  
[Twitter](https://twitter.com/MEtchegaray7)  
[Discord](https://discord.gg/K9bPkJy)  
[mtgatool@gmail.com](mailto:mtgatool@gmail.com)  

# Card art

Every card carries `Art` — the Scryfall `(set, collector number)` its image
should be fetched from — resolved at build time against Scryfall's
`default_cards` bulk snapshot.

This exists because Arena's own `(Set, CollectorNumber)` is not a usable address
into Scryfall, in two ways:

- **Nothing is there.** Arena's digital sets reprint paper cards the matching
  Scryfall set does not contain. Black Dragon is `Y23-DMU #28` in Arena and is
  simply not in `ydmu`, so the URL 404s and the card renders blank. ~1300 rows.
- **A different card is there.** Arena numbers basic lands and
  planeswalker-deck cards on its own scheme, so `ktk/252` is an Island to Arena
  and a Plains to Scryfall. A client deriving the URL shows a perfectly valid
  image of the wrong card, and nothing looks broken. ~500 rows.

`resolveCardArt.ts` re-derives the address cheapest fact first: Arena's own
address, then Scryfall's `arena_id`, then the same card in the same set by
artist, then the same card anywhere by artist. Both fact steps are checked
against the card's **name and artist** before they are believed — a set holds
four different Islands, so the name alone does not identify a printing.

Only the last step is a substitute: the right card, from a printing Arena does
not ship. Those carry `sub: 1`, and the sets they were borrowed from are named
in the top-level `artSets` map, so a client can disclose it rather than pass the
art off as the real thing. In SQLite this is `cards.art_set`, `cards.art_cn`,
`cards.art_substitute` and the `art_sets` table.

`Art` is **absent** when Scryfall has no printing of the card at all (~180 rows,
mostly Arena's new-player-experience exclusives), and on every database built
before this existed — so a consumer must keep its own fallback rather than treat
absence as an error.

Nothing here is hand-maintained. Every build re-resolves against that day's
snapshot, so a set Scryfall indexes later stops being a substitute on its own,
without anyone editing a list. A build that cannot reach Scryfall emits no `Art`
at all and still ships; `MTGATOOL_SKIP_ART=1` skips the step deliberately.

## Testing art without running the pipeline

The full run downloads Arena's manifest long before it reaches art. To iterate
on resolution alone, add `Art` to an existing metadata JSON:

```bash
npm run art -- ../mtgatool-desktop/src/assets/resources/database.json out.json
npm run sqlite -- out.json ../mtgatool-desktop/src/assets/resources/en-database.sqlite
```

mtgatool-desktop prefers a local database over the published one, so the second
command is enough to see the result in the app. Copy it to that repo's
`public/` as well for the browser build.

[![Build Status](https://travis-ci.org/Manuel-777/MTG-Arena-Tool-Metadata.svg?branch=master)](https://travis-ci.org/Manuel-777/MTG-Arena-Tool-Metadata)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

<p align="center">
  <img width="200" height="200" src="https://github.com/Manuel-777/MTG-Arena-Tool-Metadata/raw/master/icon.png"><br>
  <b><h1>MTG Arena Tool Metadata Generator</h1></b>
</p>

A metadata generator for [MTG Arena Tool](https://github.com/Manuel-777/MTG-Arena-Tool).
Magic Cards database is downloaded from [Scryfall.com](http://scryfall.com), then put together using MTG Arena's cards data.

Designed to run automatically and upload for MTG Arena Tool, but anyone is free to try it and contribute!

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

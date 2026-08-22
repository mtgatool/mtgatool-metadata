/**
 * Schema for the shipped card database.
 *
 * Design notes, since they are not obvious from the DDL:
 *
 * - `cards` mixes a faithful translation of DbCardDataV2 with the columns the
 *   client used to derive at runtime (`full_name`, `color_bits`, `craftable`,
 *   …). The JSON-shaped fields it only ever reads back and hands to the UI stay
 *   JSON text; the fields it filters or sorts on are real columns.
 *
 * - Set membership is denormalised twice on purpose. `set_aliases` is per set,
 *   which is what set-level joins ("which sets are in Standard") want.
 *   `card_set_aliases` is per card and is the literal translation of
 *   `CardsData.setCode`, which is what the collection filter matches against —
 *   including the handful of cards whose set does not resolve at all and which
 *   therefore have aliases no set carries.
 *
 * - `formats` and friends are SEEDED here from the snapshot in the repo root,
 *   because formats come from Arena's GetFormats response and not from any
 *   downloadable asset. They are build-time data with a shelf life: a ban
 *   announcement invalidates them before the next metadata release does.
 *   `formats.source` marks where a row came from so the client can later keep
 *   its own GetFormats-derived rows and tell them apart from the seed. Note
 *   that anything the client writes into THIS file is lost when a new metadata
 *   release replaces it — client-owned rows need to live in a separate database
 *   and be ATTACHed.
 *
 * - `card_formats` holds only rows where at least one flag is set, so it is
 *   ~10 rows per card rather than one per (card, format) pair.
 */

export const SCHEMA = `
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE sets (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  code        TEXT,
  arenacode   TEXT,
  scryfall    TEXT,
  -- MTGA's booster collation id, always INTEGER or NULL here. Upstream this is
  -- typed number|false, which has to be re-checked at every use; false collapses
  -- to NULL so the column has exactly one type. NULL still is not -1: -1 means
  -- the set exists but ships no boosters, and that distinction survives as
  -- "collation IS NULL" vs "collation = -1".
  collation   INTEGER,
  tile        INTEGER,
  release     TEXT,
  collectible INTEGER NOT NULL DEFAULT 0,
  digital     INTEGER NOT NULL DEFAULT 0,
  -- Set icon, base64-encoded SVG, white-filled. Same value the JSON carries.
  svg         TEXT
);

CREATE TABLE set_aliases (
  set_id INTEGER NOT NULL REFERENCES sets(id),
  alias  TEXT NOT NULL,
  PRIMARY KEY (alias, set_id)
) WITHOUT ROWID;

CREATE TABLE cards (
  grpid                    INTEGER PRIMARY KEY,
  titleid                  INTEGER,
  name                     TEXT,
  alt_name                 TEXT,
  flavor_text              TEXT,
  artist_credit            TEXT,
  rarity                   TEXT,
  set_code                 TEXT,
  digital_set              TEXT,
  set_id                   INTEGER REFERENCES sets(id),
  is_token                 INTEGER NOT NULL DEFAULT 0,
  is_primary               INTEGER NOT NULL DEFAULT 0,
  is_digital_only          INTEGER NOT NULL DEFAULT 0,
  is_rebalanced            INTEGER NOT NULL DEFAULT 0,
  rebalanced_grpid         INTEGER,
  defunct_rebalanced_grpid INTEGER,
  collector_number         TEXT,
  collector_max            TEXT,
  uses_sideboard           INTEGER,
  cmc                      INTEGER,
  linked_face_type         INTEGER,
  raw_frame_detail         TEXT,
  power                    TEXT,
  toughness                TEXT,
  types                    TEXT,
  subtypes                 TEXT,
  supertypes               TEXT,

  -- JSON passthrough: read back whole, never filtered on
  mana_cost                TEXT,
  colors                   TEXT,
  color_identity           TEXT,
  frame_colors             TEXT,
  ability_ids              TEXT,
  hidden_ability_ids       TEXT,
  linked_face_grpids       TEXT,
  ability_to_token         TEXT,
  ability_to_conjurations  TEXT,
  additional_frame_details TEXT,
  rank_data                TEXT,

  -- derived at build time; see sqlite/derive.ts
  full_name                TEXT,
  full_type                TEXT,
  artist                   TEXT,
  cid                      REAL,
  color_bits               INTEGER,
  color_sort               TEXT,
  rarity_val               INTEGER,
  rank_sort                TEXT,
  listable                 INTEGER NOT NULL DEFAULT 1,
  craftable                INTEGER NOT NULL DEFAULT 0,
  booster                  INTEGER NOT NULL DEFAULT 0,

  -- Where this card's art comes from on Scryfall; see resolveCardArt.ts.
  -- NULL when Scryfall has no printing of the card at all, which is also what
  -- a database built before art resolution existed looks like — so a consumer
  -- must keep its own fallback rather than treat NULL as an error.
  -- art_substitute marks art borrowed from a printing Arena does not ship,
  -- which the client discloses rather than passing off as the real thing.
  art_set                  TEXT,
  art_cn                   TEXT,
  art_substitute           INTEGER NOT NULL DEFAULT 0,

  -- Format legality as a bitmask, 30 bits per word (see LEGAL_WORDS). Each
  -- format owns one bit; formats.word / formats.mask say which.
  --
  -- This started as a card_formats(grpid, format_id, legal) table, which is the
  -- obvious modelling — and it was 1.68M rows, because the average card is
  -- legal in ~65 of the 138 formats. That table plus its index was 37MB of a
  -- 54MB file and took the gzipped download from 2.9MB to 14.8MB. As six
  -- integers it is ~0.5MB, still filterable in SQL ("legal_1 & 8"), and a scan
  -- of 26k rows is cheap. 30-bit words so every value stays inside a JS
  -- number and native bitwise ops.
  legal_0                  INTEGER NOT NULL DEFAULT 0,
  legal_1                  INTEGER NOT NULL DEFAULT 0,
  legal_2                  INTEGER NOT NULL DEFAULT 0,
  legal_3                  INTEGER NOT NULL DEFAULT 0,
  legal_4                  INTEGER NOT NULL DEFAULT 0,
  legal_5                  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE card_set_aliases (
  grpid INTEGER NOT NULL REFERENCES cards(grpid),
  alias TEXT NOT NULL,
  PRIMARY KEY (grpid, alias)
) WITHOUT ROWID;

CREATE TABLE card_reprints (
  grpid         INTEGER NOT NULL REFERENCES cards(grpid),
  reprint_grpid INTEGER NOT NULL,
  PRIMARY KEY (grpid, reprint_grpid)
) WITHOUT ROWID;

-- Display names for the Scryfall sets substitute art was taken from. Only the
-- sets actually borrowed from are here; Arena's own sets live in the sets table.
CREATE TABLE art_sets (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE abilities (
  id   INTEGER PRIMARY KEY,
  text TEXT
);

CREATE TABLE formats (
  id                     INTEGER PRIMARY KEY,
  name                   TEXT NOT NULL UNIQUE,
  -- Where this format's legality bit lives: cards.legal_<word> & mask.
  word                   INTEGER NOT NULL,
  mask                   INTEGER NOT NULL,
  format_type            TEXT,
  card_count_restriction TEXT,
  sideboard_behavior     TEXT,
  use_rebalanced         INTEGER,
  main_min               INTEGER,
  main_max               INTEGER,
  side_min               INTEGER,
  side_max               INTEGER,
  cz_min                 INTEGER,
  cz_max                 INTEGER,
  source                 TEXT NOT NULL DEFAULT 'seed'
);

-- kind: 'legal' (legalSets) | 'filter' (filterSets)
CREATE TABLE format_sets (
  format_id INTEGER NOT NULL REFERENCES formats(id),
  set_code  TEXT NOT NULL,
  kind      TEXT NOT NULL,
  PRIMARY KEY (format_id, kind, set_code)
) WITHOUT ROWID;

-- kind: 'banned' | 'suspended' | 'allowed' | 'supressed' | 'commander'
CREATE TABLE format_cards (
  format_id INTEGER NOT NULL REFERENCES formats(id),
  title_id  INTEGER NOT NULL,
  kind      TEXT NOT NULL,
  PRIMARY KEY (format_id, kind, title_id)
) WITHOUT ROWID;

CREATE TABLE format_card_quotas (
  format_id INTEGER NOT NULL REFERENCES formats(id),
  title_id  INTEGER NOT NULL,
  max       INTEGER,
  PRIMARY KEY (format_id, title_id)
) WITHOUT ROWID;

CREATE TABLE format_groups (
  group_name TEXT NOT NULL,
  format_id  INTEGER NOT NULL REFERENCES formats(id),
  position   INTEGER NOT NULL,
  PRIMARY KEY (group_name, format_id)
) WITHOUT ROWID;

-- Legality as rows, for ad-hoc queries and for checking the masks are right.
-- The fast path is testing cards.legal_<word> directly; this exists so the
-- relationship is still expressible as a join.
CREATE VIEW v_card_legal AS
  SELECT c.grpid, f.id AS format_id, f.name AS format
    FROM cards c
    JOIN formats f ON
         (f.word = 0 AND (c.legal_0 & f.mask) <> 0)
      OR (f.word = 1 AND (c.legal_1 & f.mask) <> 0)
      OR (f.word = 2 AND (c.legal_2 & f.mask) <> 0)
      OR (f.word = 3 AND (c.legal_3 & f.mask) <> 0)
      OR (f.word = 4 AND (c.legal_4 & f.mask) <> 0)
      OR (f.word = 5 AND (c.legal_5 & f.mask) <> 0);

-- Banned and suspended stay relational: unlike legality they are sparse (a few
-- hundred rows in total), so format_cards already covers them by title_id.
CREATE VIEW v_card_banned AS
  SELECT c.grpid, f.name AS format, fc.kind
    FROM cards c
    JOIN format_cards fc ON fc.title_id = c.titleid
                        AND fc.kind IN ('banned', 'suspended')
    JOIN formats f ON f.id = fc.format_id;
`;

/** Bits per legality word. 30 keeps every value inside a JS safe integer. */
export const LEGAL_BITS_PER_WORD = 30;

/** How many legality words `cards` has — the cap on format count. */
export const LEGAL_WORDS = 6;

/**
 * Created after the bulk insert — building indexes once over a full table is
 * substantially faster than maintaining them per row.
 */
export const INDEXES = `
CREATE INDEX idx_cards_set        ON cards(set_id);
CREATE INDEX idx_cards_name       ON cards(name);
CREATE INDEX idx_cards_titleid    ON cards(titleid);
CREATE INDEX idx_cards_rarity     ON cards(rarity);
CREATE INDEX idx_cards_cmc        ON cards(cmc);
CREATE INDEX idx_cards_listable   ON cards(listable) WHERE listable = 1;
CREATE INDEX idx_set_aliases_set  ON set_aliases(set_id);
CREATE INDEX idx_card_aliases_a   ON card_set_aliases(alias);
CREATE INDEX idx_format_sets_code ON format_sets(set_code);
CREATE INDEX idx_format_cards_tid ON format_cards(title_id);
`;

/**
 * Full-text index over the three fields the collection search box hits.
 *
 * External-content table: it stores only the index, reading values back from
 * `cards` (grpid is the rowid). Costs ~2MB rather than a second copy of the
 * text. Kept separate because it needs an FTS5-enabled SQLite — verify the
 * client driver before relying on it, and pass `fts: false` to omit it.
 */
export const FTS = `
CREATE VIRTUAL TABLE cards_fts USING fts5(
  full_name,
  full_type,
  artist,
  content='cards',
  content_rowid='grpid',
  tokenize='unicode61 remove_diacritics 2'
);
INSERT INTO cards_fts(rowid, full_name, full_type, artist)
  SELECT grpid, full_name, full_type, artist FROM cards;
`;

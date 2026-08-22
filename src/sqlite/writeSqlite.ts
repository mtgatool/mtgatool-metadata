import fs from "fs";

import Database from "better-sqlite3";
import { CardSet } from "mtgatool-shared";

import { DbCardDataV2 } from "../types/metadata";
import { SetCardData } from "../setCardData";
import { deriveCardData, SeedFormat, SetsIndex } from "./derive";
import readFormatsSeed, { SeedFormatRaw } from "./formatsSeed";
import {
  FTS,
  INDEXES,
  LEGAL_BITS_PER_WORD,
  LEGAL_WORDS,
  SCHEMA,
} from "./schema";

export interface SqliteInput {
  cards: Record<number, DbCardDataV2>;
  sets: Record<string, CardSet & SetCardData>;
  setNames: Record<string, string>;
  digitalSets: string[];
  abilities: Record<number, string>;
  /** Scryfall set code -> display name, for substitute art. */
  artSets?: Record<string, string>;
  version: string;
  language: string;
  updated: number;
}

export interface SqliteOptions {
  /** Emit the FTS5 index. Requires an FTS5-enabled SQLite in the consumer. */
  fts?: boolean;
}

export interface SqliteStats {
  cards: number;
  sets: number;
  abilities: number;
  formats: number;
  legalPairs: number;
  bytes: number;
}

function json(value: unknown): string {
  return JSON.stringify(value === undefined ? null : value);
}

function bool(value: unknown): number {
  return value ? 1 : 0;
}

/**
 * Write the whole metadata payload out as a SQLite database.
 *
 * Runs in one transaction with journalling off — the file is built from
 * scratch every time, so there is nothing to recover to — then indexes,
 * ANALYZE and VACUUM once the tables are full.
 */
export default function writeSqliteDatabase(
  input: SqliteInput,
  outPath: string,
  options: SqliteOptions = {}
): SqliteStats {
  const withFts = options.fts !== false;

  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  const db = new Database(outPath);

  db.pragma("journal_mode = OFF");
  db.pragma("synchronous = OFF");
  db.pragma("page_size = 4096");
  db.exec(SCHEMA);

  const seed = readFormatsSeed();
  const sets = input.sets as SetsIndex;
  const digital: Record<string, boolean> = {};
  input.digitalSets.forEach((name) => {
    digital[name] = true;
  });

  /* ------------------------------------------------------------- statements */

  const insMeta = db.prepare(`INSERT INTO meta (key, value) VALUES (?, ?)`);

  const insSet = db.prepare(
    `INSERT INTO sets
       (id, name, code, arenacode, scryfall, collation, tile, release,
        collectible, digital, svg)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insSetAlias = db.prepare(
    `INSERT OR IGNORE INTO set_aliases (set_id, alias) VALUES (?, ?)`
  );

  const insCard = db.prepare(
    `INSERT INTO cards (
       grpid, titleid, name, alt_name, flavor_text, artist_credit, rarity,
       set_code, digital_set, set_id, is_token, is_primary, is_digital_only,
       is_rebalanced, rebalanced_grpid, defunct_rebalanced_grpid,
       collector_number, collector_max, uses_sideboard, cmc, linked_face_type,
       raw_frame_detail, power, toughness, types, subtypes, supertypes,
       mana_cost, colors, color_identity, frame_colors, ability_ids,
       hidden_ability_ids, linked_face_grpids, ability_to_token,
       ability_to_conjurations, additional_frame_details, rank_data,
       full_name, full_type, artist, cid, color_bits, color_sort, rarity_val,
       rank_sort, listable, craftable, booster,
       art_set, art_cn, art_substitute,
       legal_0, legal_1, legal_2, legal_3, legal_4, legal_5
     ) VALUES (
       @grpid, @titleid, @name, @alt_name, @flavor_text, @artist_credit,
       @rarity, @set_code, @digital_set, @set_id, @is_token, @is_primary,
       @is_digital_only, @is_rebalanced, @rebalanced_grpid,
       @defunct_rebalanced_grpid, @collector_number, @collector_max,
       @uses_sideboard, @cmc, @linked_face_type, @raw_frame_detail, @power,
       @toughness, @types, @subtypes, @supertypes, @mana_cost, @colors,
       @color_identity, @frame_colors, @ability_ids, @hidden_ability_ids,
       @linked_face_grpids, @ability_to_token, @ability_to_conjurations,
       @additional_frame_details, @rank_data, @full_name, @full_type, @artist,
       @cid, @color_bits, @color_sort, @rarity_val, @rank_sort, @listable,
       @craftable, @booster, @art_set, @art_cn, @art_substitute, @legal_0,
       @legal_1, @legal_2, @legal_3, @legal_4, @legal_5
     )`
  );
  const insCardAlias = db.prepare(
    `INSERT OR IGNORE INTO card_set_aliases (grpid, alias) VALUES (?, ?)`
  );
  const insReprint = db.prepare(
    `INSERT OR IGNORE INTO card_reprints (grpid, reprint_grpid) VALUES (?, ?)`
  );
  const insAbility = db.prepare(
    `INSERT OR REPLACE INTO abilities (id, text) VALUES (?, ?)`
  );
  const insArtSet = db.prepare(
    `INSERT OR REPLACE INTO art_sets (code, name) VALUES (?, ?)`
  );

  const insFormat = db.prepare(
    `INSERT INTO formats
       (id, name, word, mask, format_type, card_count_restriction,
        sideboard_behavior, use_rebalanced, main_min, main_max, side_min,
        side_max, cz_min, cz_max, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'seed')`
  );
  const insFormatSet = db.prepare(
    `INSERT OR IGNORE INTO format_sets (format_id, set_code, kind)
     VALUES (?, ?, ?)`
  );
  const insFormatCard = db.prepare(
    `INSERT OR IGNORE INTO format_cards (format_id, title_id, kind)
     VALUES (?, ?, ?)`
  );
  const insFormatQuota = db.prepare(
    `INSERT OR IGNORE INTO format_card_quotas (format_id, title_id, max)
     VALUES (?, ?, ?)`
  );
  const insFormatGroup = db.prepare(
    `INSERT OR IGNORE INTO format_groups (group_name, format_id, position)
     VALUES (?, ?, ?)`
  );

  /* ------------------------------------------------------------------ write */

  const stats: SqliteStats = {
    cards: 0,
    sets: 0,
    abilities: 0,
    formats: 0,
    legalPairs: 0,
    bytes: 0,
  };

  const setIds: Record<string, number> = {};
  const formatIds: Record<string, number> = {};
  const formatBits: Record<string, number> = {};

  const writeAll = db.transaction(() => {
    insMeta.run("version", input.version);
    insMeta.run("language", input.language);
    insMeta.run("updated", String(input.updated));
    insMeta.run("generator", "mtgatool-metadata");
    insMeta.run("schema", "1");

    // Sets first — cards reference them.
    Object.keys(sets).forEach((name, index) => {
      const set = sets[name];
      const id = index + 1;
      setIds[name] = id;
      insSet.run(
        id,
        name,
        set.code || null,
        set.arenacode || null,
        set.scryfall || null,
        typeof set.collation === "number" ? set.collation : null,
        typeof set.tile === "number" ? set.tile : null,
        set.release || null,
        bool(set.collectible),
        bool(digital[name]),
        set.svg || null
      );
      (set.aliases || []).forEach((alias) => insSetAlias.run(id, alias));
      stats.sets += 1;
    });

    // Formats, before cards, so card_formats has something to reference.
    const legalityFormats: SeedFormat[] = [];
    if (seed.Formats.length > LEGAL_WORDS * LEGAL_BITS_PER_WORD) {
      throw new Error(
        `${seed.Formats.length} formats exceeds the ${
          LEGAL_WORDS * LEGAL_BITS_PER_WORD
        } the legality bitmask holds. Add legal_N columns in schema.ts and ` +
          `raise LEGAL_WORDS.`
      );
    }

    seed.Formats.forEach((format: SeedFormatRaw, index) => {
      const formatId = index + 1;
      formatIds[format.name] = formatId;
      formatBits[format.name] = index;
      const main = format.mainDeckQuota || {};
      const side = format.sideBoardQuota || {};
      const cz = format.commandZoneQuota || {};
      insFormat.run(
        formatId,
        format.name,
        Math.floor(index / LEGAL_BITS_PER_WORD),
        1 << index % LEGAL_BITS_PER_WORD,
        format.FormatType || null,
        format.cardCountRestriction || null,
        format.sideboardBehavior || null,
        format.useRebalancedCards === undefined
          ? null
          : bool(format.useRebalancedCards),
        main.min === undefined ? null : main.min,
        main.max === undefined ? null : main.max,
        side.min === undefined ? null : side.min,
        side.max === undefined ? null : side.max,
        cz.min === undefined ? null : cz.min,
        cz.max === undefined ? null : cz.max
      );

      (format.legalSets || []).forEach((code) =>
        insFormatSet.run(formatId, code, "legal")
      );
      (format.filterSets || []).forEach((code) =>
        insFormatSet.run(formatId, code, "filter")
      );
      (format.bannedTitleIds || []).forEach((id) =>
        insFormatCard.run(formatId, id, "banned")
      );
      (format.suspendedTitleIds || []).forEach((id) =>
        insFormatCard.run(formatId, id, "suspended")
      );
      (format.allowedTitleIds || []).forEach((id) =>
        insFormatCard.run(formatId, id, "allowed")
      );
      (format.supressedTitleIds || []).forEach((id) =>
        insFormatCard.run(formatId, id, "supressed")
      );
      (format.AllowedCommanderTitleIds || []).forEach((id) =>
        insFormatCard.run(formatId, id, "commander")
      );
      Object.keys(format.individualCardQuotas || {}).forEach((titleId) => {
        const quota = (format.individualCardQuotas || {})[titleId];
        insFormatQuota.run(formatId, parseInt(titleId, 10), quota.max);
      });

      legalityFormats.push({
        name: format.name,
        legalSets: format.legalSets || [],
        bannedTitleIds: format.bannedTitleIds || [],
        suspendedTitleIds: format.suspendedTitleIds || [],
        allowedTitleIds: format.allowedTitleIds || [],
      });
      stats.formats += 1;
    });

    seed.FormatGroups.forEach((group) => {
      group.FormatNames.forEach((name, position) => {
        // Arena's groups occasionally name a format the Formats list omits.
        if (formatIds[name] === undefined) return;
        insFormatGroup.run(group.GroupName, formatIds[name], position);
      });
    });

    Object.keys(input.abilities).forEach((id) => {
      insAbility.run(parseInt(id, 10), input.abilities[parseInt(id, 10)]);
      stats.abilities += 1;
    });

    const artSets = input.artSets || {};
    Object.keys(artSets).forEach((code) => {
      insArtSet.run(code, artSets[code]);
    });

    Object.keys(input.cards).forEach((key) => {
      const card = input.cards[parseInt(key, 10)];
      if (!card) return;

      const derived = deriveCardData(
        card,
        input.cards,
        input.setNames,
        sets,
        legalityFormats
      );

      const legal: number[] = [];
      for (let w = 0; w < LEGAL_WORDS; w += 1) legal.push(0);
      derived.legalFormats.forEach((name) => {
        const bit = formatBits[name];
        if (bit === undefined) return;
        const word = Math.floor(bit / LEGAL_BITS_PER_WORD);
        legal[word] |= 1 << bit % LEGAL_BITS_PER_WORD;
      });

      // The set a card is distributed under is not always its origin, and the
      // raw code carries a sub-collation suffix ("SPG-MKM") that setNames does
      // not, hence the fallback to the part before the dash.
      const rawSet =
        card.DigitalSet && card.DigitalSet !== "" ? card.DigitalSet : card.Set;
      const setName =
        input.setNames[rawSet] || input.setNames[rawSet.split("-")[0]];

      insCard.run({
        grpid: card.GrpId,
        titleid: card.TitleId,
        name: card.Name,
        alt_name: card.AltName,
        flavor_text: card.FlavorText,
        artist_credit: card.ArtistCredit,
        rarity: card.Rarity,
        set_code: card.Set,
        digital_set: card.DigitalSet,
        set_id: setName ? setIds[setName] : null,
        is_token: bool(card.IsToken),
        is_primary: bool(card.IsPrimaryCard),
        is_digital_only: bool(card.IsDigitalOnly),
        is_rebalanced: bool(card.IsRebalanced),
        rebalanced_grpid: card.RebalancedCardGrpId,
        defunct_rebalanced_grpid: card.DefunctRebalancedCardGrpId,
        collector_number: card.CollectorNumber,
        collector_max: card.CollectorMax,
        uses_sideboard: card.UsesSideboard,
        cmc: card.Cmc,
        linked_face_type: card.LinkedFaceType,
        raw_frame_detail: card.RawFrameDetail,
        power: card.Power,
        toughness: card.Toughness,
        types: card.Types,
        subtypes: card.Subtypes,
        supertypes: card.Supertypes,
        mana_cost: json(card.ManaCost),
        colors: json(card.Colors),
        color_identity: json(card.ColorIdentity),
        frame_colors: json(card.FrameColors),
        ability_ids: json(card.AbilityIds),
        hidden_ability_ids: json(card.HiddenAbilityIds),
        linked_face_grpids: json(card.LinkedFaceGrpIds),
        ability_to_token: json(card.AbilityIdToLinkedTokenGrpId),
        ability_to_conjurations: json(card.AbilityIdToLinkedConjurations),
        additional_frame_details: json(card.AdditionalFrameDetails),
        rank_data: json(card.RankData),
        full_name: derived.fullName,
        full_type: derived.fullType,
        artist: derived.artist,
        cid: derived.cid,
        color_bits: derived.colorBits,
        color_sort: derived.colorSort,
        rarity_val: derived.rarityVal,
        rank_sort: derived.rankSort,
        listable: bool(derived.listable),
        craftable: bool(derived.craftable),
        booster: bool(derived.booster),
        art_set: card.Art ? card.Art.s : null,
        art_cn: card.Art ? card.Art.n : null,
        art_substitute: bool(card.Art && card.Art.sub),
        legal_0: legal[0],
        legal_1: legal[1],
        legal_2: legal[2],
        legal_3: legal[3],
        legal_4: legal[4],
        legal_5: legal[5],
      });

      derived.setAliases.forEach((alias) =>
        insCardAlias.run(card.GrpId, alias)
      );
      card.Reprints.forEach((id) => insReprint.run(card.GrpId, id));

      stats.cards += 1;
      stats.legalPairs += derived.legalFormats.length;
    });
  });

  writeAll();

  db.exec(INDEXES);
  if (withFts) db.exec(FTS);

  db.pragma(`user_version = ${parseInt(input.version, 10) || 0}`);
  db.exec("ANALYZE");
  db.close();

  // VACUUM needs its own connection once everything else is closed out.
  const vac = new Database(outPath);
  vac.exec("VACUUM");
  vac.close();

  stats.bytes = fs.statSync(outPath).size;
  return stats;
}

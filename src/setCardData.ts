import { CardSet } from "mtgatool-shared";

import { DbCardDataV2 } from "./types/metadata";

/**
 * Per-set facts derived from the card pool, resolved once at build time.
 *
 * Both of these were previously re-derived by every consumer, over the whole
 * 26k-card table, on every render — and both were getting it wrong.
 */
export interface SetCardData {
  /**
   * Whether the set has any card of its own that a collection can list.
   *
   * Arena ships plenty of sets it never actually released. Commander Masters
   * contributes eleven cards, all `IsPrimaryCard: false` — alternate printings
   * of cards whose real entries live elsewhere, so a collection filtered to CMM
   * can only show duplicates of rows it already displayed. Clue Edition, Tales
   * of Middle-earth Commander and Through the Omenpaths are the same. Others
   * contribute nothing but basic-land art (Unstable, Zendikar, Assassin's
   * Creed) or tokens (Ultimate Masters, Commander Legends), and Hour of
   * Devastation exists solely as the two halves of Consign // Oblivion.
   *
   * This draws the line where getCardInBoosters already draws it.
   */
  collectible: boolean;
  /**
   * Every set code a card of this set can legitimately answer to, lowercased.
   *
   * Arena tags digital printings with a sub-collation suffix — Special Guests
   * ships as `SPG-MKM`/`SPG-OTJ`, Marvel Super Heroes Commander as
   * `MSC-JUMPSTART` — and its own code sometimes differs from the paper one
   * (Dominaria is `DAR` in Arena, `DOM` everywhere else). A consumer matching a
   * single bare code against the raw value finds nothing, which is exactly how
   * ~20 sets came to return zero cards despite having hundreds.
   */
  aliases: string[];
}

/** Faces that are never listed as a row of their own. */
const NON_LISTED_FACES = [
  1, // DFC back
  3, // meld
  5, // split
  7, // adventure
  9, // modal back
  11, // specialize back
  15, // room
  17, // omen
];

/** The set code a card is distributed under, which is not always its origin. */
export function effectiveSetCode(card: DbCardDataV2): string {
  return card.DigitalSet && card.DigitalSet !== "" ? card.DigitalSet : card.Set;
}

/**
 * Resolve a raw Arena set code to its set name, tolerating the sub-collation
 * suffix that `setNames` does not carry ("SPG-MKM" -> "SPG").
 */
export function resolveSetName(
  code: string,
  setNames: Record<string, string>
): string | undefined {
  return setNames[code] || setNames[code.split("-")[0]];
}

/**
 * Compute `collectible` and `aliases` for every set, from the finished cards.
 */
export default function computeSetCardData(
  cards: Record<number, DbCardDataV2 | undefined>,
  sets: Record<string, CardSet>,
  setNames: Record<string, string>
): Record<string, SetCardData> {
  const result: Record<string, SetCardData> = {};
  const aliases: Record<string, Set<string>> = {};

  Object.keys(sets).forEach((name) => {
    const set = sets[name];
    aliases[name] = new Set<string>();
    [set.code, set.arenacode, set.scryfall].forEach((code) => {
      if (code) aliases[name].add(code.toLowerCase());
    });
    result[name] = { collectible: false, aliases: [] };
  });

  Object.values(cards).forEach((card) => {
    if (!card || !card.Name) return;
    const raw = effectiveSetCode(card);
    if (!raw) return;
    const name = resolveSetName(raw, setNames);
    if (!name || !result[name]) return;

    // Every raw code seen on a real card is something a consumer may be asked
    // to match, tokens and alternate printings included.
    aliases[name].add(raw.toLowerCase());
    aliases[name].add(raw.split("-")[0].toLowerCase());

    if (card.IsToken) return;
    if (NON_LISTED_FACES.includes(card.LinkedFaceType)) return;
    if (!card.IsPrimaryCard) return;
    if (card.Rarity === "land") return;
    result[name].collectible = true;
  });

  Object.keys(result).forEach((name) => {
    result[name].aliases = Array.from(aliases[name]).sort();
  });

  return result;
}

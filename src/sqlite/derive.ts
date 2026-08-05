/**
 * Card facts the desktop client currently re-derives, at runtime, for all
 * ~26k cards, on every collection mount (`src/cards-worker/getCollectionData.ts`).
 *
 * None of them depend on the player's collection, so they are build-time data
 * and belong in the shipped database. Everything here is a deliberate port of
 * the client helpers it replaces — including two long-standing bugs, which are
 * reproduced rather than fixed so this migration is behaviour-preserving. Both
 * are marked BUG-COMPAT below and are one-line changes when you want them gone.
 */
import { CardSet } from "mtgatool-shared";

import { DbCardDataV2 } from "../types/metadata";
import { SetCardData } from "../setCardData";

export type SetsIndex = Record<string, CardSet & SetCardData>;

/** Ported from cards-worker/findSetByCode.ts */
export function findSetByCode(
  code: string,
  setNames: Record<string, string>,
  sets: SetsIndex
): (CardSet & SetCardData) | undefined {
  const name = setNames[code];
  return name ? sets[name] : undefined;
}

/* ------------------------------------------------------------------ colors */

const WHITE = 1;
const BLUE = 2;
const BLACK = 3;
const RED = 4;
const GREEN = 5;
const COLORLESS = 6;

const FLAG_W = 1;
const FLAG_U = 2;
const FLAG_B = 4;
const FLAG_R = 8;
const FLAG_G = 16;
const FLAG_C = 32;

interface ColorState {
  w: boolean;
  u: boolean;
  b: boolean;
  r: boolean;
  g: boolean;
  c: boolean;
}

/**
 * Ported from cards-worker/colors.ts `addFromCost`. The client switches on
 * every character of every mana symbol; only w/u/b/r/g, "x" and the single
 * digits are reachable that way (the "10".."20" cases in the original never
 * match a single char), so those are what this reproduces.
 */
function colorsFromCost(cost: string[]): ColorState {
  const s: ColorState = {
    w: false,
    u: false,
    b: false,
    r: false,
    g: false,
    c: false,
  };
  if (cost.length === 0) s.c = true;

  cost.forEach((symbol) => {
    for (let i = 0; i < symbol.length; i += 1) {
      const ch = symbol[i];
      if (ch === "w") s.w = true;
      else if (ch === "u") s.u = true;
      else if (ch === "b") s.b = true;
      else if (ch === "r") s.r = true;
      else if (ch === "g") s.g = true;
      else if (ch === "x" || (ch >= "1" && ch <= "9")) s.c = true;
    }
  });

  return s;
}

/** cards-worker/colors.ts `get()` — colors as non-repeating constants. */
function colorConstants(s: ColorState): number[] {
  const arr: number[] = [];
  if (s.w) arr.push(WHITE);
  if (s.u) arr.push(BLUE);
  if (s.b) arr.push(BLACK);
  if (s.r) arr.push(RED);
  if (s.g) arr.push(GREEN);
  if (s.c) arr.push(COLORLESS);
  return arr;
}

/** cards-worker/colors.ts `getBits()`. */
function colorBits(s: ColorState): number {
  let bits = 0;
  if (s.w) bits |= FLAG_W;
  if (s.u) bits |= FLAG_U;
  if (s.b) bits |= FLAG_B;
  if (s.r) bits |= FLAG_R;
  if (s.g) bits |= FLAG_G;
  if (s.c) bits |= FLAG_C;
  return bits;
}

/* ------------------------------------------------------------------ rarity */

/** Ported from cards-worker/getRarityFilterVal.ts */
export function rarityFilterVal(rarity: string): number {
  switch (rarity) {
    case "token":
      return 1;
    case "land":
      return 2;
    case "common":
      return 4;
    case "uncommon":
      return 8;
    case "rare":
      return 16;
    case "mythic":
      return 32;
    default:
      return 0;
  }
}

/* ------------------------------------------------------------- draft ranks */

const DRAFT_RANKS = [
  "F",
  "D-",
  "D",
  "D+",
  "C-",
  "C",
  "C+",
  "B-",
  "B",
  "B+",
  "A-",
  "A",
  "A+",
];

const DRAFT_RANKS_LOLA = [
  "",
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

function rankSortVal(card: DbCardDataV2): string {
  const source = card.RankData.rankSource === 0 ? DRAFT_RANKS : DRAFT_RANKS_LOLA;
  const rank =
    card.RankData.rankSource !== -1 ? (card.RankData as any).rank : 0;
  const val = source[rank];
  return val === undefined ? "?" : val;
}

/* ----------------------------------------------------------------- formats */

/** The subset of a GetFormats entry the legality rules actually read. */
export interface SeedFormat {
  name: string;
  legalSets: string[];
  bannedTitleIds: number[];
  suspendedTitleIds: number[];
  allowedTitleIds: number[];
}

/** Formats whose legality is additionally gated on rarity. */
const PAUPER_FORMATS = ["Pauper", "HistoricPauper"];

/**
 * Ported from cards-worker/getCardFormats.ts.
 *
 * BUG-COMPAT: the reprint branch pushes `setObj.arenacode` un-lowercased while
 * the comparison lowercases the format's set code, so a reprint's set can never
 * match and reprints effectively never widen legality. Preserved here; fix by
 * lowercasing the push below, but expect legality to change for reprinted cards.
 */
export function cardLegalFormats(
  card: DbCardDataV2,
  allCards: Record<number, DbCardDataV2>,
  setNames: Record<string, string>,
  sets: SetsIndex,
  formats: SeedFormat[]
): string[] {
  const allowed: string[] = [];
  const arenaSetCode: string[] = [card.Set.toLowerCase()];
  if (card.DigitalSet) {
    arenaSetCode.push(card.DigitalSet.toLowerCase());
  }
  card.Reprints.forEach((cid: number) => {
    const reprint = allCards[cid];
    if (reprint) {
      const setObj = findSetByCode(
        reprint.DigitalSet === null || reprint.DigitalSet === ""
          ? reprint.Set
          : reprint.DigitalSet,
        setNames,
        sets
      );
      if (setObj) {
        arenaSetCode.push(setObj.arenacode); // BUG-COMPAT: not lowercased
      }
    }
  });

  formats.forEach((format) => {
    const legal =
      (format.allowedTitleIds.indexOf(card.TitleId) >= 0 ||
        format.legalSets.some(
          (set) => arenaSetCode.indexOf(set.toLowerCase()) >= 0
        )) &&
      format.bannedTitleIds.indexOf(card.TitleId) < 0;

    if (!legal) return;

    if (PAUPER_FORMATS.indexOf(format.name) >= 0) {
      if (card.Rarity === "common") allowed.push(format.name);
    } else {
      allowed.push(format.name);
    }
  });

  return allowed;
}

/** Ported from cards-worker/getCardInBoosters.ts */
export function cardInBoosters(
  card: DbCardDataV2,
  setNames: Record<string, string>,
  sets: SetsIndex
): boolean {
  const set = findSetByCode(
    card.DigitalSet === null || card.DigitalSet === ""
      ? card.Set
      : card.DigitalSet,
    setNames,
    sets
  );

  if (card.IsToken) return false;
  if (set && set.collation === -1) return false;
  if (card.LinkedFaceType === 11) return false;
  if (!card.IsPrimaryCard) return false;
  return true;
}

const CRAFTABLE_FORMATS = [
  "Standard",
  "Historic",
  "Alchemy",
  "Explorer",
  "Timeless",
  "Singleton",
];

/**
 * Ported from cards-worker/getCardIsCraftable.ts.
 *
 * BUG-COMPAT: the guard reads `card.Rarity === "land" || !card.IsToken`, so
 * every non-token card returns false and only tokens are ever "craftable" —
 * the inverse of what the filter means. Preserved; drop the `!` to fix.
 */
export function cardIsCraftable(
  card: DbCardDataV2,
  legalFormats: string[]
): boolean {
  if (card.Rarity === "land" || !card.IsToken) return false;
  if (card.LinkedFaceType === 11) return false;
  return legalFormats.some((f) => CRAFTABLE_FORMATS.indexOf(f) >= 0);
}

/* ------------------------------------------------------------------- faces */

/**
 * Faces the collection never lists as a row of their own — the same set
 * `getCollectionData` filters out before mapping.
 */
const NON_LISTED_FACES = [
  1, // DFC back
  3, // meld
  5, // split
  7, // adventure
  9, // modal back
  11, // specialize back
  15, // room
];

export function isListable(card: DbCardDataV2): boolean {
  return NON_LISTED_FACES.indexOf(card.LinkedFaceType) < 0;
}

/* ------------------------------------------------------------ the full row */

export interface DerivedCardData {
  fullName: string;
  fullType: string;
  artist: string;
  cid: number | null;
  colorBits: number;
  colorSort: string;
  rarityVal: number;
  rankSort: string;
  listable: boolean;
  craftable: boolean;
  booster: boolean;
  /** Every set code this card can legitimately answer to, lowercased. */
  setAliases: string[];
  legalFormats: string[];
  bannedFormats: string[];
  suspendedFormats: string[];
}

/**
 * Everything `getCollectionData` computes for one card, minus `owned` and
 * `acquired` (which are the player's, not the card's).
 */
export function deriveCardData(
  card: DbCardDataV2,
  allCards: Record<number, DbCardDataV2>,
  setNames: Record<string, string>,
  sets: SetsIndex,
  formats: SeedFormat[]
): DerivedCardData {
  const dfc =
    allCards[card.LinkedFaceGrpIds.length > 0 ? card.LinkedFaceGrpIds[0] : 0];
  const dfcName = dfc && dfc.Name ? dfc.Name.toLowerCase() : "";

  const colorState = colorsFromCost(card.ManaCost);
  const colorSort = colorConstants(colorState).join("");
  let bits = colorBits(colorState);
  if (bits > 31 && bits !== 32) {
    bits -= 32;
  }

  // Arena tags digital printings with a sub-collation suffix ("SPG-MKM"), and
  // its own code sometimes differs from the paper one ("DAR" vs "DOM"), so a
  // card answers to several codes. Metadata resolves the list per set; the
  // manual build is the fallback for a set that does not resolve at all.
  const rawSet =
    card.DigitalSet && card.DigitalSet !== "" ? card.DigitalSet : card.Set;
  const baseSet = rawSet.split("-")[0];
  const setObj =
    findSetByCode(rawSet, setNames, sets) ||
    findSetByCode(baseSet, setNames, sets);

  let setAliases: string[];
  if (setObj && setObj.aliases) {
    setAliases = setObj.aliases;
  } else {
    const fallback: string[] = [];
    [
      rawSet.toLowerCase(),
      baseSet.toLowerCase(),
      setObj && setObj.code ? setObj.code.toLowerCase() : undefined,
      setObj && setObj.arenacode ? setObj.arenacode.toLowerCase() : undefined,
    ].forEach((code) => {
      if (code && fallback.indexOf(code) < 0) fallback.push(code);
    });
    setAliases = fallback;
  }

  const legalFormats = cardLegalFormats(card, allCards, setNames, sets, formats);

  const bannedFormats: string[] = [];
  const suspendedFormats: string[] = [];
  formats.forEach((format) => {
    if (format.bannedTitleIds.indexOf(card.TitleId) >= 0) {
      bannedFormats.push(format.name);
    }
    if (format.suspendedTitleIds.indexOf(card.TitleId) >= 0) {
      suspendedFormats.push(format.name);
    }
  });

  const cid = parseFloat(card.CollectorNumber);

  return {
    fullName: `${card.Name.toLowerCase()} ${dfcName}`,
    fullType: [
      card.Supertypes.toLowerCase(),
      card.Types.toLowerCase(),
      card.Subtypes.toLowerCase(),
    ].join(" "),
    artist: card.ArtistCredit ? card.ArtistCredit.toLowerCase() : "",
    cid: isNaN(cid) ? null : cid,
    colorBits: bits,
    colorSort,
    rarityVal: rarityFilterVal(card.Rarity),
    rankSort: rankSortVal(card),
    listable: isListable(card),
    craftable: cardIsCraftable(card, legalFormats),
    booster: cardInBoosters(card, setNames, sets),
    setAliases,
    legalFormats,
    bannedFormats,
    suspendedFormats,
  };
}

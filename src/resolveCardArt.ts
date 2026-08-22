import { ScryfallBulk, ScryfallPrint } from "./scryfallBulk";

/**
 * Which Scryfall printing each Arena card should show art from.
 *
 * Arena's own (set, collector number) is not a reliable address into Scryfall.
 * Two things go wrong with it, and the second is the worse one:
 *
 *  - Scryfall has no such print. Arena's digital sets reprint paper cards that
 *    the matching Scryfall set does not contain — Black Dragon is Y23-DMU #28 in
 *    Arena and simply is not in `ydmu` — so the URL 404s and the card renders
 *    blank. ~1300 rows.
 *  - Scryfall has a print at that address, but it is a DIFFERENT CARD. Arena
 *    numbers basics and planeswalker-deck cards on its own scheme, so `ktk/252`
 *    is an Island to Arena and a Plains to Scryfall. The client shows a perfectly
 *    valid image of the wrong card and nothing looks broken. ~530 rows.
 *
 * So the address is re-derived here, at build time, cheapest fact first:
 *
 *  1. Arena's own (set, number), if a print is there AND it is this card.
 *  2. Scryfall's `arena_id`, if it points at a print of this card.
 *  3. Failing both, the same card in the same set, by artist.
 *  4. Failing that, the same card anywhere, by artist — a substitute.
 *
 * Steps 1 and 2 are facts and settle ~97% of the table. Both are checked
 * against the card's name before they are believed, which is not paranoia:
 * `ktk/252` is an Island to Arena and a Plains to Scryfall, and Scryfall's
 * own arena_id repeats that same mistake. The name check catches it and drops
 * the card to step 3, where the artist credit finds the right Island.
 *
 * Only steps 3 and 4 rank candidates, and by then the candidates are already
 * known to be the same card — the ranking chooses an illustration, never a
 * card. That distinction is the whole reason a score is tolerable here: for
 * the ~1300 cards Scryfall has no Arena printing of, there is no fact left to
 * consult, and "closest artist credit" is the only signal there is.
 */
export interface CardArt {
  /** Scryfall set code the art comes from. Token sets keep their `t` prefix. */
  s: string;
  /** Collector number within that set. */
  n: string;
  /**
   * Present when this is a stand-in rather than the printing Arena ships —
   * a different set, or the same set by a different artist. The client marks
   * these so a player is never quietly shown the wrong illustration.
   */
  sub?: 1;
}

export interface ArtResolution {
  /** grpId -> resolved art. Cards Scryfall has nothing for are absent. */
  art: Record<number, CardArt>;
  /** Scryfall set code -> display name, for substitutes only. */
  artSets: Record<string, string>;
  stats: ArtStats;
}

export interface ArtStats {
  /** Arena's own (set, number) landed on this exact card. */
  exact: number;
  /** Scryfall's arena_id landed on this exact card. */
  byArenaId: number;
  /** Same set and same artist, corrected collector number. */
  corrected: number;
  /** Another printing by the same artist. */
  substituteByArtist: number;
  /** Another printing, artist unknown or unmatched. */
  substituteAny: number;
  /** Scryfall has no printing of this card at all. */
  unresolved: number;
}

/** The card fields art resolution needs, in English whatever the build's language. */
export interface ArtCardInput {
  GrpId: number;
  /** ENGLISH name. A localized one matches nothing in the bulk data. */
  Name: string;
  Set: string;
  DigitalSet: string;
  CollectorNumber: string;
  ArtistCredit: string;
  IsToken: boolean;
}

/** Layouts that are a token's art, and never a real card's. */
const TOKEN_LAYOUTS: Record<string, true> = {
  token: true,
  double_faced_token: true,
  emblem: true,
};

/**
 * Fold a card name to a comparison key.
 *
 * Accents, apostrophes and hyphens all differ between the two sources, and
 * Arena writes split cards with three slashes where Scryfall uses two.
 */
export function normalizeName(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\/+/g, " // ")
    .replace(/[^a-z0-9/ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArtist(artist: string): string {
  return (artist || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Within two edits of each other — Arena has outright typos in artist names. */
function withinTwoEdits(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 2) return false;
      if (a.length > b.length) i += 1;
      else if (b.length > a.length) j += 1;
      else {
        i += 1;
        j += 1;
      }
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 2;
}

/**
 * How confident we are that two artist credits are the same person, 0-100.
 *
 * Exact string equality is close to useless here. Arena drops middle names
 * ("Dan Scott" for "Dan Murayama Scott"), drops first names ("Parente" for
 * "Paolo Parente"), adds them ("Jenn Ravenna Tran" for "Ravenna Tran") and
 * misspells them ("Massimilano" for "Massimiliano Frezzato").
 */
export function artistScore(arena: string, scryfall: string): number {
  const a = normalizeArtist(arena);
  const b = normalizeArtist(scryfall);
  if (!a || !b) return 0;
  if (a === b) return 100;

  const ta = a.split(" ");
  const tb = b.split(" ");
  const shared = ta.filter((t) => tb.indexOf(t) >= 0);
  if (shared.length === Math.min(ta.length, tb.length)) return 90;
  if (withinTwoEdits(a, b)) return 85;
  if (ta[ta.length - 1] === tb[tb.length - 1]) return 70;
  if (shared.length > 0) return 40 + shared.length;
  return 0;
}

/** At or above this, we treat the credit as naming the same illustrator. */
const ARTIST_MATCH = 70;

/**
 * Index every print by set+number and by every name it answers to.
 *
 * A split card is indexed under its full name and each face, because Arena
 * files some of them under a single face.
 */
export function buildArtIndex(bulk: ScryfallBulk): {
  bySetCn: Record<string, ScryfallPrint>;
  byName: Record<string, ScryfallPrint[]>;
  byArenaId: Record<number, ScryfallPrint>;
} {
  const bySetCn: Record<string, ScryfallPrint> = {};
  const byName: Record<string, ScryfallPrint[]> = {};
  const byArenaId: Record<number, ScryfallPrint> = {};

  bulk.prints.forEach((print) => {
    if (print.arenaId !== null && byArenaId[print.arenaId] === undefined) {
      byArenaId[print.arenaId] = print;
    }
    const addr = `${print.set}/${print.cn}`;
    // Bulk data holds one row per print; a duplicate address would be a
    // Scryfall bug, and keeping the first is as good an answer as any.
    if (!bySetCn[addr]) bySetCn[addr] = print;

    const keys: string[] = [normalizeName(print.name)];
    print.name.split(" // ").forEach((face) => {
      const k = normalizeName(face);
      if (k && keys.indexOf(k) < 0) keys.push(k);
    });
    print.faces.forEach((face) => {
      const k = normalizeName(face);
      if (k && keys.indexOf(k) < 0) keys.push(k);
    });

    keys.forEach((key) => {
      if (!key) return;
      if (!byName[key]) byName[key] = [];
      byName[key].push(print);
    });
  });

  return { bySetCn, byName, byArenaId };
}

/**
 * Rank a candidate printing for a card.
 *
 * The artist term dominates every other term combined, deliberately. Preferring
 * the set first looks reasonable and is wrong: Arena's GRN #5 is the
 * planeswalker-deck Ral, Izzet Viceroy by Daniel Ljunggren, and `grn` holds only
 * the main-set Ral by Kieran Yanner. Ranking by set picks a Ral with the wrong
 * picture; ranking by artist finds Ljunggren's in `pana`, which is the art Arena
 * actually ships.
 */
function score(
  print: ScryfallPrint,
  card: ArtCardInput,
  setCode: string | null
): number {
  let s = artistScore(card.ArtistCredit, print.artist) * 1000000;
  if (setCode && print.set === setCode) s += 10000;
  if (print.highres) s += 400;
  if (!print.digital) s += 200;
  s += parseInt((print.released || "").slice(0, 4), 10) || 0;
  return s;
}

/**
 * Resolve where every card's art comes from.
 *
 * `sets` maps an Arena set code (as it appears on a card) to the Scryfall code
 * for that set — the same mapping the client uses to build image URLs today.
 */
export default function resolveCardArt(
  cards: ArtCardInput[],
  arenaToScryfall: (arenaSetCode: string) => string | null,
  bulk: ScryfallBulk
): ArtResolution {
  const { bySetCn, byName, byArenaId } = buildArtIndex(bulk);
  const art: Record<number, CardArt> = {};
  const artSets: Record<string, string> = {};
  const stats: ArtStats = {
    exact: 0,
    byArenaId: 0,
    corrected: 0,
    substituteByArtist: 0,
    substituteAny: 0,
    unresolved: 0,
  };

  cards.forEach((card) => {
    if (!card.Name) return;

    const base = arenaToScryfall(
      card.DigitalSet && card.DigitalSet !== "" ? card.DigitalSet : card.Set
    );
    // Scryfall files a set's tokens under a `t`-prefixed set of their own.
    const setCode = base ? (card.IsToken ? `t${base}` : base) : null;

    const key = normalizeName(card.Name);
    // An Alchemy rebalance and its paper original are the same illustration, so
    // "A-Static Discharge" and "Static Discharge" count as the same card here.
    const unrebalanced = normalizeName(card.Name.replace(/^A-/, ""));
    const nameMatches = (print: ScryfallPrint): boolean => {
      const candidates = [print.name]
        .concat(print.name.split(" // "))
        .concat(print.faces);
      return candidates.some((candidate) => {
        const n = normalizeName(candidate);
        if (n === key) return true;
        return normalizeName(candidate.replace(/^A-/, "")) === unrebalanced;
      });
    };

    // A print is only the card's own printing if the name AND the artist agree.
    // Requiring the name alone is not enough, and basic lands are why: Khans of
    // Tarkir holds four different Islands, so "the print at this address is
    // named Island" is satisfied by three illustrations that are not this one.
    // Where either side has no artist credit there is nothing to check and the
    // name has to carry it.
    const isThisPrinting = (print: ScryfallPrint): boolean => {
      if (!nameMatches(print)) return false;
      if (!card.ArtistCredit || !print.artist) return true;
      return artistScore(card.ArtistCredit, print.artist) >= ARTIST_MATCH;
    };

    // (1) Arena's own address. When it happens to be right it needs no override
    // at all, but emitting it anyway keeps one rule on the client, not two.
    const direct =
      setCode && card.CollectorNumber
        ? bySetCn[`${setCode}/${card.CollectorNumber}`]
        : undefined;
    if (direct && isThisPrinting(direct)) {
      art[card.GrpId] = { s: direct.set, n: direct.cn };
      stats.exact += 1;
      return;
    }

    // (2) Scryfall's own claim about which Arena card this print is. It covers
    // ~78% of the table and no tokens to speak of, and it disagrees with the
    // name on 48 of 19520 rows — 8 of those genuinely wrong (the basic-land
    // numbering again, KTK and LCI), the rest an Alchemy rebalance filed under
    // its unrebalanced twin or the reverse. Trusting it only when the name
    // agrees keeps the first group out and, via the A- tolerance, lets the
    // second group through, which is right: a rebalance reuses the artwork.
    const claimed = byArenaId[card.GrpId];
    if (claimed && isThisPrinting(claimed)) {
      art[card.GrpId] = { s: claimed.set, n: claimed.cn };
      stats.byArenaId += 1;
      return;
    }

    let pool = byName[key] || [];
    if (pool.length === 0) {
      // Alchemy rebalances are "A-Name" in Arena. Scryfall carries most of them
      // under that name too, but retires one now and then ("No longer
      // rebalanced") while Arena keeps shipping it. The unrebalanced print uses
      // the same illustration, so it is the right stand-in.
      if (unrebalanced !== key) pool = byName[unrebalanced] || [];
    }
    // A token's art lives on a token print, and a real card's never does.
    pool = pool.filter((print) =>
      card.IsToken
        ? !!TOKEN_LAYOUTS[print.layout]
        : !TOKEN_LAYOUTS[print.layout]
    );

    if (pool.length === 0) {
      stats.unresolved += 1;
      return;
    }

    let best = pool[0];
    let bestScore = score(best, card, setCode);
    pool.forEach((print) => {
      const s = score(print, card, setCode);
      if (s > bestScore) {
        best = print;
        bestScore = s;
      }
    });

    const artistMatched =
      artistScore(card.ArtistCredit, best.artist) >= ARTIST_MATCH;

    // Nothing anywhere is credited to this artist, so the credit itself is the
    // doubtful part. An address that named the right card is then better
    // evidence than a ranking built on the credit that just failed: far more
    // likely a name spelt differently in the two databases than a printing
    // Arena does not have.
    const named =
      direct && nameMatches(direct)
        ? direct
        : claimed && nameMatches(claimed)
        ? claimed
        : null;
    if (!artistMatched && named) best = named;

    // Trustworthy as Arena's own printing: either the artist agrees, or the
    // address does and the artist told us nothing either way.
    const authentic = artistMatched || best === named;
    const sameSet = !!setCode && best.set === setCode;

    if (authentic && sameSet) {
      // The right card, in the right set, by the right artist — Arena just
      // numbers it differently. Nothing to disclose to the player.
      art[card.GrpId] = { s: best.set, n: best.cn };
      stats.corrected += 1;
      return;
    }

    art[card.GrpId] = { s: best.set, n: best.cn, sub: 1 };
    if (bulk.setNames[best.set]) artSets[best.set] = bulk.setNames[best.set];
    if (artistMatched) stats.substituteByArtist += 1;
    else stats.substituteAny += 1;
  });

  return { art, artSets, stats };
}

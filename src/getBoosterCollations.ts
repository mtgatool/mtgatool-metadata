import { CardSet } from "mtgatool-shared";
import readExternalJson from "./readExternalJson";

/**
 * Booster ids, read from Arena's own asset data instead of listed by hand.
 *
 * `collation` is the id Arena tags a booster with. It is what tells a set apart
 * as something you can open packs of, and it is how a player's boosters are
 * counted against the set they belong to. It used to be read out of the game's
 * memory, which was laborious enough that it stopped happening: every set for
 * two years carried -1, so the app announced them all as not available for
 * draft and counted none of their boosters.
 *
 * It never needed the memory reader. Booster.json — already downloaded by
 * setup, over HTTP, on any platform — carries the lookup tree Arena uses to
 * pick booster artwork, and its connections are keyed by the very ids we want:
 *
 *   Connections: [{ Parent: <collation mapping node>,
 *                   Child: { "100048": <node drawing BoosterPack_FDN> } }]
 *
 * So the id is whatever opens a pack showing that set's art. Derived here at
 * build time, which is also what stops it going stale again.
 */

/** Play boosters. Draft (200xxx) and mythic (500xxx) are the same set. */
const FIRST_BOOSTER_ID = 100000;
const LAST_BOOSTER_ID = 200000;

const ART = /^BoosterPack_([A-Za-z0-9]+)\.(png|jpg)$/i;

/** Arena set code (upper case) to the id of the booster showing its art. */
export function readBoosterCollations(): Record<string, number> {
  const trees = readExternalJson("Booster.json");
  const found: Record<string, number> = {};
  if (!trees || typeof trees !== "object") return found;

  Object.values(trees as Record<string, any>).forEach((tree: any) => {
    const byId: Record<string, any> = {};
    (tree?.Nodes || []).forEach((node: any) => {
      byId[node.NodeId] = node;
    });

    (tree?.Connections || []).forEach((connection: any) => {
      // A branch keyed by collation id; anything else is a plain edge.
      if (!connection?.Child || typeof connection.Child !== "object") return;

      Object.entries(connection.Child).forEach(([id, nodeId]) => {
        const art = byId[nodeId as string]?.Payload?.TextureRef?.RelativePath;
        if (!art) return;

        const match = ART.exec(String(art).split("/").pop() || "");
        if (!match) return;

        const collation = Number(id);
        if (collation < FIRST_BOOSTER_ID || collation >= LAST_BOOSTER_ID) return;

        const code = match[1].toUpperCase();
        // A set reaches several booster kinds; the play booster is the lowest.
        found[code] = Math.min(found[code] ?? Infinity, collation);
      });
    });
  });

  return found;
}

/**
 * Fill in and correct the booster ids on a set list.
 *
 * A set with its own booster art is settled by that art. A set without any —
 * the bonus sheets, which are opened inside another set's packs and share its
 * id on purpose — keeps what it was given, unless the set it was sharing with
 * has just moved, in which case it moves too. Without that last part,
 * correcting a parent would quietly leave its bonus sheets pointing at whoever
 * inherited the old number.
 */
export default function applyBoosterCollations<T extends CardSet>(
  sets: Record<string, T>,
  log = console.log
): Record<string, T> {
  const derived = readBoosterCollations();
  if (!Object.keys(derived).length) {
    log("[boosters] no booster ids found; leaving collations as they are");
    return sets;
  }

  const out: Record<string, T> = {};
  const moved: Record<number, number> = {};
  let filled = 0;
  let corrected = 0;

  Object.entries(sets).forEach(([name, set]) => {
    const id = derived[String(set.arenacode).toUpperCase()];
    if (id === undefined) {
      out[name] = set;
      return;
    }
    if (set.collation === id) {
      out[name] = set;
      return;
    }

    if (set.collation === -1 || set.collation === false) {
      filled += 1;
    } else {
      corrected += 1;
      moved[set.collation as number] = id;
      log(`[boosters] ${set.arenacode}: ${set.collation} -> ${id} (${name})`);
    }
    out[name] = { ...set, collation: id };
  });

  // Bonus sheets follow the set whose packs they come in.
  Object.entries(out).forEach(([name, set]) => {
    if (derived[String(set.arenacode).toUpperCase()] !== undefined) return;
    const follow = moved[set.collation as number];
    if (follow === undefined) return;
    log(`[boosters] ${set.arenacode}: follows to ${follow} (${name})`);
    out[name] = { ...set, collation: follow };
  });

  log(`[boosters] ${filled} set(s) filled in, ${corrected} corrected`);
  return out;
}

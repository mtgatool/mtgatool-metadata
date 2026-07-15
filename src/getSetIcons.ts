import fs from "fs";
import path from "path";

import MagicSet from "scryfall-client/dist/models/magic-set";
import {
  AKR_SVG,
  ARENA_SVG,
  KLR_SVG,
  SETS_DATA,
  STX_SVG,
  STA_SVG,
  VOW_SVG,
  HBG_SVG,
} from "./metadata-constants";
import httpGetTextAsync from "./utils/httpGetTextAsync";

type SetName = keyof typeof SETS_DATA;

// Repo-committed icon cache. Keyed by Scryfall set code, storing the already
// white-filled base64 SVG plus the release date. Committed to the repo so builds
// don't ping Scryfall for sets we've already resolved.
const CACHE_PATH = path.resolve(process.cwd(), "set-icons.json");

interface CachedIcon {
  svg: string;
  release: string;
}

function loadIconCache(): Record<string, CachedIcon> {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (e) {
    console.log(`Could not read set-icons cache: ${String(e)}`);
  }
  return {};
}

function saveIconCache(cache: Record<string, CachedIcon>): void {
  try {
    // Stable key order keeps the committed diff minimal from build to build.
    const ordered: Record<string, CachedIcon> = {};
    Object.keys(cache)
      .sort()
      .forEach((k) => {
        ordered[k] = cache[k];
      });
    fs.writeFileSync(CACHE_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
  } catch (e) {
    console.log(`Could not write set-icons cache: ${String(e)}`);
  }
}

// Sets Scryfall doesn't provide an icon for — use a bundled SVG instead.
const HARDCODED_SVG: Record<string, string> = {
  "Amonketh Remastered": AKR_SVG,
  "Kaladesh Remastered": KLR_SVG,
  "Strixhaven: School of Mages": STX_SVG,
  "Strixhaven Mystical Archive": STA_SVG,
  "Innistrad: Crimson Vow": VOW_SVG,
  "Alchemy Horizons: Baldur's Gate": HBG_SVG,
};

// Sets that just use the generic Arena icon (and skip the Scryfall fetch).
const ARENA_ICON_SETS = ["", "ANC", "Arena New Player Experience"];

function whiteFill(svg: string): string {
  return svg
    .replace(/fill="#.*?"\ */g, " ")
    .replace(/<path /g, '<path fill="#FFF" ');
}

/**
 * Resolve each set's symbol SVG.
 *
 * Icons are cosmetic and change rarely, so we cache them in the repo
 * (set-icons.json) and only hit Scryfall for sets we've never resolved before.
 * A build that adds no new sets makes zero Scryfall requests. Newly fetched
 * icons are written back into the cache (and committed by CI) so the next build
 * reuses them. This must never break the run: every set is handled
 * independently and any failure is skipped, leaving that set without an icon.
 */
export default async function getSetIcons(): Promise<void> {
  const setNames = Object.keys(SETS_DATA) as SetName[];
  const cache = loadIconCache();
  console.log("Obtaining Sets data.");
  console.log(`${setNames.length} total, ${Object.keys(cache).length} cached`);

  let cached = 0;
  let fetched = 0;
  let skipped = 0;
  let bundled = 0;

  // Resolve one set. Returns true if it hit the network (so the caller can
  // throttle only the requests that actually reach Scryfall).
  const processSet = async (setName: SetName): Promise<boolean> => {
    try {
      if (ARENA_ICON_SETS.includes(setName) || setName in HARDCODED_SVG) {
        SETS_DATA[setName].svg = Buffer.from(
          whiteFill(HARDCODED_SVG[setName] || ARENA_SVG)
        ).toString("base64");
        bundled += 1;
        return false;
      }

      let code = SETS_DATA[setName].scryfall;
      if (setName === "M19 Gift Pack") code = "m19";
      if (!code || code === "default") {
        skipped += 1;
        return false;
      }

      // Use the committed cache first — no Scryfall ping for known sets.
      const hit = cache[code];
      if (hit && hit.svg) {
        SETS_DATA[setName].svg = hit.svg;
        SETS_DATA[setName].release = hit.release || "";
        cached += 1;
        return false;
      }

      // New set (or one we failed to cache before): fetch from Scryfall.
      const setStr = await httpGetTextAsync(
        `https://api.scryfall.com/sets/${code}`
      );
      const setData = JSON.parse(setStr) as MagicSet;
      const release = setData.released_at || "";
      SETS_DATA[setName].release = release;

      if (!setData.icon_svg_uri) {
        skipped += 1;
        return true;
      }

      let svg = await httpGetTextAsync(setData.icon_svg_uri);
      if (code === "akr") svg = AKR_SVG;
      if (code === "klr") svg = KLR_SVG;
      if (code === "stx") svg = STX_SVG;
      if (code === "sta") svg = STA_SVG;
      if (code === "vow") svg = VOW_SVG;

      const b64 = Buffer.from(whiteFill(svg)).toString("base64");
      SETS_DATA[setName].svg = b64;
      // Persist for future builds so we never fetch this set again.
      cache[code] = { svg: b64, release };
      fetched += 1;
      return true;
    } catch (e) {
      skipped += 1;
      console.log(`Skipping set icon for "${setName}": ${String(e)}`);
      return false;
    }
  };

  // Scryfall rate-limits (~10 req/s) and rejects bursts, so throttle only the
  // sets that actually reach the network. Cached sets resolve with no delay.
  // eslint-disable-next-line no-restricted-syntax
  for (const setName of setNames) {
    // eslint-disable-next-line no-await-in-loop
    const didFetch = await processSet(setName);
    if (didFetch) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Write the (possibly grown) cache back so CI can commit the new icons.
  if (fetched > 0) saveIconCache(cache);

  console.log(
    `Get set icons done (${cached} cached, ${fetched} fetched, ${bundled} bundled, ${skipped} skipped)`
  );
}

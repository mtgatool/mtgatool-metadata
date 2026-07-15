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
const ARENA_ICON_SETS = [
  "",
  "ANC",
  "Arena New Player Experience",
];

function whiteFill(svg: string): string {
  return svg
    .replace(/fill="#.*?"\ */g, " ")
    .replace(/<path /g, '<path fill="#FFF" ');
}

/**
 * Fetch each set's symbol SVG from Scryfall. This is cosmetic enrichment, so it
 * must never break the run: every set is handled independently and any
 * failure (dead set code, network hiccup) is skipped, leaving that set without
 * an icon. Rewritten from a fragile count-based resolve that hung on failures
 * and crashed by writing Error objects to stdout.
 */
export default async function getSetIcons(): Promise<void> {
  const setNames = Object.keys(SETS_DATA) as SetName[];
  console.log("Obtaining Sets data.");
  console.log(setNames.length + " total");

  let ok = 0;
  let skipped = 0;

  const processSet = async (setName: SetName): Promise<void> => {
    try {
      if (ARENA_ICON_SETS.includes(setName) || setName in HARDCODED_SVG) {
        SETS_DATA[setName].svg = Buffer.from(
          whiteFill(HARDCODED_SVG[setName] || ARENA_SVG)
        ).toString("base64");
        ok += 1;
        return;
      }

      let code = SETS_DATA[setName].scryfall;
      if (setName === "M19 Gift Pack") code = "m19";
      if (!code || code === "default") {
        skipped += 1;
        return;
      }

      const setStr = await httpGetTextAsync(
        `https://api.scryfall.com/sets/${code}`
      );
      const setData = JSON.parse(setStr) as MagicSet;
      SETS_DATA[setName].release = setData.released_at || "";

      if (!setData.icon_svg_uri) {
        skipped += 1;
        return;
      }

      let svg = await httpGetTextAsync(setData.icon_svg_uri);
      if (code === "akr") svg = AKR_SVG;
      if (code === "klr") svg = KLR_SVG;
      if (code === "stx") svg = STX_SVG;
      if (code === "sta") svg = STA_SVG;
      if (code === "vow") svg = VOW_SVG;

      SETS_DATA[setName].svg = Buffer.from(whiteFill(svg)).toString("base64");
      ok += 1;
    } catch (e) {
      skipped += 1;
      console.log(`Skipping set icon for "${setName}": ${String(e)}`);
    }
  };

  // Scryfall rate-limits (~10 req/s) and rejects bursts, so process sequentially
  // with a small delay rather than firing ~360 requests at once (which returned
  // 429/403 and left most sets without an icon).
  // eslint-disable-next-line no-restricted-syntax
  for (const setName of setNames) {
    // eslint-disable-next-line no-await-in-loop
    await processSet(setName);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log(`Get set icons done (${ok} ok, ${skipped} skipped)`);
}

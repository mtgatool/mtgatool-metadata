import MagicSet from "scryfall-client/dist/models/magic-set";
import { SETS_DATA } from "./metadata-constants";
import { readSetFiles, writeSetFile } from "./setFiles";
import httpGetTextAsync from "./utils/httpGetTextAsync";

export function whiteFill(svg: string): string {
  return svg
    .replace(/fill="#.*?"\ */g, " ")
    .replace(/<path /g, '<path fill="#FFF" ');
}

/**
 * Resolve each set's symbol SVG.
 *
 * Icons live in each set's sets/<code>.json file, so a set that has one costs
 * nothing here. Only sets missing an icon — normally just brand-new ones that
 * the update script could not resolve yet — reach Scryfall, and whatever is
 * fetched is written back into the set's file so no build fetches it twice.
 * This must never break the run: every set is handled independently and any
 * failure is skipped, leaving that set without an icon until the next build.
 */
export default async function getSetIcons(): Promise<void> {
  const files = readSetFiles();
  console.log("Obtaining Sets data.");

  let cached = 0;
  let fetched = 0;
  let skipped = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    if (file.svg) {
      cached += 1;
      continue;
    }
    const code = file.scryfall;
    if (!code || code === "default") {
      skipped += 1;
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const setStr = await httpGetTextAsync(
        `https://api.scryfall.com/sets/${code}`
      );
      const setData = JSON.parse(setStr) as MagicSet;
      const release = setData.released_at || file.release;

      if (!setData.icon_svg_uri) {
        skipped += 1;
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const svg = await httpGetTextAsync(setData.icon_svg_uri);
      const b64 = Buffer.from(whiteFill(svg)).toString("base64");

      SETS_DATA[file.name].svg = b64;
      SETS_DATA[file.name].release = release;
      writeSetFile({ ...file, release, svg: b64 });
      fetched += 1;
    } catch (e) {
      skipped += 1;
      console.log(`Skipping set icon for "${file.name}": ${String(e)}`);
    }

    // Scryfall rate-limits (~10 req/s) and rejects bursts; throttle the sets
    // that actually reach the network.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(
    `Get set icons done (${cached} cached, ${fetched} fetched, ${skipped} skipped)`
  );
}

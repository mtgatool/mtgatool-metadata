import fs from "fs";
import https from "https";
import path from "path";
import readline from "readline";
import zlib from "zlib";

import { APPDATA, EXTERNAL } from "./metadata-constants";
import { BulkDataResponse } from "./types/metadata";

/** The one file we care about: every print Scryfall knows, in English. */
const BULK_TYPE = "default_cards";
const BULK_FILE = "scryfall-default-cards.jsonl.gz";

/**
 * Socket-idle deadlines. `https.get` has none of its own, so a connection that
 * is accepted and then goes quiet never settles its promise: the build hangs
 * forever and the stale-cache/null fallbacks below never get their chance.
 * These are idle timeouts, not absolute ones — a 77MB download that is slow but
 * still arriving must not be killed for taking its time.
 */
const JSON_IDLE_MS = 30000;
const DOWNLOAD_IDLE_MS = 60000;

/** Scryfall rejects (403) requests without a descriptive User-Agent. */
const HEADERS = {
  "User-Agent": "mtgatool-metadata/1.0 (https://mtgatool.com)",
  Accept: "application/json",
};

/**
 * One Scryfall printing, reduced to the fields art resolution needs.
 *
 * The bulk file is ~500MB of JSON once expanded and holds ~117k prints; keeping
 * whole card objects costs a gigabyte for data we never read. The set's display
 * name is deliberately NOT on here — it is the same string for every print of a
 * set, and interning it in a lookup table instead saves ~100k duplicate strings.
 */
export interface ScryfallPrint {
  /**
   * Arena's own grpId for this print, when Scryfall knows it.
   *
   * This is the only hard join between the two databases, and it beats every
   * other signal — but it covers ~78% of Arena's cards and almost no tokens,
   * and it is not infallible (Scryfall maps Arena's KTK Islands onto KTK
   * Plains), so it is checked against the card name before it is trusted.
   */
  arenaId: number | null;
  /** Scryfall set code, lowercased. Token sets carry their own `t` prefix. */
  set: string;
  /** Collector number as printed. Not always numeric ("A-52", "270★"). */
  cn: string;
  name: string;
  /** Face names, for split/DFC cards whose Arena entry is one face. */
  faces: string[];
  artist: string;
  digital: boolean;
  /** ISO date, used only to prefer a newer scan between equal candidates. */
  released: string;
  layout: string;
  highres: boolean;
}

export interface ScryfallBulk {
  prints: ScryfallPrint[];
  /** Scryfall set code -> display name, for the substitute-art tooltip. */
  setNames: Record<string, string>;
}

function getJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = https
      .get(url, { headers: HEADERS }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          // Drain the body we are not going to read, so the socket is freed.
          res.resume();
          reject(new Error(`${url} responded ${res.statusCode}`));
          return;
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => {
          body += c;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body) as T);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
    // setTimeout only notifies; it does not abort. destroy() is what turns the
    // stall into an error the caller can fall back from.
    request.setTimeout(JSON_IDLE_MS, () => {
      request.destroy(new Error(`${url} timed out after ${JSON_IDLE_MS}ms`));
    });
  });
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Write to a temp name and rename, so an interrupted run can never leave a
    // truncated file that the next one happily reads as cached.
    const tmp = `${dest}.part`;
    let stream: fs.WriteStream | undefined;
    let settled = false;

    // One cleanup path for every failure. pipe() does not forward the
    // response's errors to the write stream, so destroying the request — which
    // is exactly what the idle timeout does — would otherwise reject with the
    // stream still open and the partial file still on disk.
    const fail = (err: Error): void => {
      if (settled) return;
      settled = true;
      const drop = (): void => {
        fs.unlink(tmp, () => reject(err));
      };
      if (stream && !stream.destroyed) {
        stream.once("close", drop);
        stream.destroy();
        return;
      }
      drop();
    };

    const req = (target: string, hops: number): void => {
      if (hops > 5) {
        fail(new Error("too many redirects"));
        return;
      }
      const request = https
        .get(target, { headers: HEADERS }, (res) => {
          // data.scryfall.io hands out redirects to its CDN.
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            res.resume();
            req(res.headers.location, hops + 1);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            fail(new Error(`${target} responded ${res.statusCode}`));
            return;
          }
          const out = fs.createWriteStream(tmp);
          stream = out;
          res.pipe(out);
          // An aborted response reaches us here, not on the write stream.
          res.on("error", fail);
          out.on("finish", () => {
            out.close(() => {
              if (settled) return;
              try {
                fs.renameSync(tmp, dest);
              } catch (e) {
                fail(e as Error);
                return;
              }
              settled = true;
              resolve();
            });
          });
          out.on("error", fail);
        })
        .on("error", fail);
      request.setTimeout(DOWNLOAD_IDLE_MS, () => {
        request.destroy(
          new Error(`${target} timed out after ${DOWNLOAD_IDLE_MS}ms`)
        );
      });
    };
    req(url, 0);
  });
}

/**
 * Fetch Scryfall's bulk card data, reusing the cached copy while it is fresh.
 *
 * Returns the file path, or null if Scryfall could not be reached. Null is a
 * normal outcome, not a failure: art resolution is skipped for that build and
 * the client falls back to deriving image URLs itself, exactly as it did before
 * any of this existed. A metadata release must never hinge on a third party
 * being up.
 */
export default async function downloadScryfallBulk(
  maxAgeHours = 20
): Promise<string | null> {
  const dir = path.join(APPDATA, EXTERNAL);
  // recursive: creates APPDATA too, and is a no-op when the directory exists.
  // This sits outside the try below, so an ENOENT here would escape the
  // null-return contract the docstring promises.
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, BULK_FILE);

  if (fs.existsSync(dest)) {
    const ageHours = (Date.now() - fs.statSync(dest).mtimeMs) / 3600000;
    if (ageHours < maxAgeHours) {
      console.log(
        `Scryfall bulk data cached (${ageHours.toFixed(1)}h old), reusing.`
      );
      return dest;
    }
  }

  try {
    const list = await getJson<BulkDataResponse>(
      "https://api.scryfall.com/bulk-data"
    );
    const entry = list.data.filter((d) => d.type === BULK_TYPE)[0] as
      | (BulkDataResponse["data"][0] & { jsonl_download_uri?: string })
      | undefined;
    if (!entry) throw new Error(`no ${BULK_TYPE} in bulk-data`);

    // The line-delimited variant streams; the plain one is a single 500MB JSON
    // array that has to be parsed whole.
    const url = entry.jsonl_download_uri || entry.download_uri;
    console.log(`Downloading Scryfall bulk data (${BULK_TYPE})..`);
    await download(url, dest);
    console.log(`Scryfall bulk data saved to ${dest}`);
    return dest;
  } catch (e) {
    console.log(`Could not fetch Scryfall bulk data: ${String(e)}`);
    // A stale copy still resolves almost every card; only brand-new prints are
    // missing from it. Much better than resolving nothing.
    if (fs.existsSync(dest)) {
      console.log("Falling back to the stale cached copy.");
      return dest;
    }
    return null;
  }
}

/** Layouts that are never a card's own art: art cards, oversized novelties. */
const JUNK_LAYOUTS: Record<string, true> = {
  art_series: true,
  planar: true,
  scheme: true,
  vanguard: true,
  augment: true,
  host: true,
};

/**
 * Read the bulk file into the reduced print list.
 *
 * Streamed line by line: the expanded JSON is far past V8's max string length,
 * so it cannot be read and parsed whole.
 */
export async function readScryfallBulk(file: string): Promise<ScryfallBulk> {
  const prints: ScryfallPrint[] = [];
  const setNames: Record<string, string> = {};

  const input = fs.createReadStream(file).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  // eslint-disable-next-line no-restricted-syntax
  for await (const line of rl) {
    // Tolerate both the jsonl file and the plain JSON array, whose lines carry
    // the array's brackets and trailing commas.
    const trimmed = line.trim().replace(/,$/, "");
    if (!trimmed || trimmed === "[" || trimmed === "]") continue;

    let card: any;
    try {
      card = JSON.parse(trimmed);
    } catch (e) {
      continue;
    }
    if (!card || !card.set || card.collector_number == null) continue;
    if (JUNK_LAYOUTS[card.layout]) continue;

    const set = String(card.set).toLowerCase();
    if (card.set_name && !setNames[set]) setNames[set] = card.set_name;

    const faces: string[] = [];
    if (Array.isArray(card.card_faces)) {
      card.card_faces.forEach((f: any) => {
        if (f && f.name) faces.push(f.name);
      });
    }

    prints.push({
      arenaId: typeof card.arena_id === "number" ? card.arena_id : null,
      set,
      cn: String(card.collector_number),
      name: card.name || "",
      faces,
      // Arena credits one artist even on two-faced cards; Scryfall puts it on
      // the faces and leaves the top level empty for some of those.
      artist:
        card.artist ||
        (Array.isArray(card.card_faces) && card.card_faces[0]
          ? card.card_faces[0].artist
          : "") ||
        "",
      digital: !!card.digital,
      released: card.released_at || "",
      layout: card.layout || "normal",
      highres: !!card.highres_image,
    });
  }

  return { prints, setNames };
}

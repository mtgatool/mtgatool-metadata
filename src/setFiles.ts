import fs from "fs";
import path from "path";
import { CardSet } from "mtgatool-shared";

/**
 * On-disk shape of one sets/<code>.json file. See sets/README.md for the
 * schema and the reasoning behind the flags.
 */
export interface SetFile extends CardSet {
  /** Display name; becomes the SETS_DATA key. */
  name: string;
  /**
   * The client resolves this set's cards on Scryfall by NAME instead of by
   * collector number (formerly the DIGITAL_SETS list). Set it when Arena's
   * numbering does not correspond to Scryfall's — by-number lookups then 404
   * or, worse, resolve to a confidently wrong card.
   */
  byName?: boolean;
}

export const SETS_DIR = path.resolve(__dirname, "..", "sets");

/** Every set is filed under its Arena code; the unnamed default set aside. */
export function setFilePath(code: string): string {
  return path.join(SETS_DIR, `${(code || "default").toLowerCase()}.json`);
}

export function readSetFiles(): SetFile[] {
  return fs
    .readdirSync(SETS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(SETS_DIR, f), "utf8")));
}

export function writeSetFile(set: SetFile): void {
  fs.writeFileSync(setFilePath(set.code), `${JSON.stringify(set, null, 2)}\n`);
}

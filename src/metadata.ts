import fs from "fs";
import _ from "lodash";

import { getArenaVersion, getManifestFiles } from "./manifest-parser";
import { generateMetadata } from "./metadata-generator";

import { APPDATA, OUTPUT, VERSION, LANGUAGES } from "./metadata-constants";

import getSetIcons from "./getSetIcons";

import getRanksData from "./getRanksData";

import downloadScryfallBulk, {
  readScryfallBulk,
  ScryfallBulk,
} from "./scryfallBulk";

import { ranksData } from "./utils/globals";

console.log(APPDATA);

const OutDIr = "./" + OUTPUT;
if (!fs.existsSync(OutDIr)) {
  fs.mkdirSync(OutDIr);
}

const VersionDIr = "./" + OUTPUT + "/" + VERSION;
if (!fs.existsSync(VersionDIr)) {
  fs.mkdirSync(VersionDIr);
}

console.log("Begin Metadata fetch.");

/**
 * Scryfall's card corpus, for resolving where each card's art comes from.
 *
 * Never fatal: a build that cannot reach Scryfall still ships, just without
 * the Art field, and consumers fall back to deriving image URLs themselves.
 */
async function getScryfallBulk(): Promise<ScryfallBulk | null> {
  if (process.env.MTGATOOL_SKIP_ART) {
    console.log("MTGATOOL_SKIP_ART set, skipping card art resolution.");
    return null;
  }
  try {
    const file = await downloadScryfallBulk();
    if (!file) return null;
    const bulk = await readScryfallBulk(file);
    console.log(`Read ${bulk.prints.length} Scryfall prints.`);
    return bulk;
  } catch (e) {
    console.log(`Could not read Scryfall bulk data: ${String(e)}`);
    return null;
  }
}

getArenaVersion("Live")
  .then(getManifestFiles)
  .then(getRanksData)
  .then(getSetIcons)
  .then(getScryfallBulk)
  .then((bulk) => generateMetadata(ranksData, VERSION, LANGUAGES, bulk))
  .then(quit);

function quit() {
  console.log("Goodbye!!");
  process.exit();
}

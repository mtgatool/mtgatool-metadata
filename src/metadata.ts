import fs from "fs";
import _ from "lodash";

import { getArenaVersion, getManifestFiles } from "./manifest-parser";
import { generateMetadata } from "./metadata-generator";

import { APPDATA, OUTPUT, VERSION, LANGUAGES } from "./metadata-constants";

import getSetIcons from "./getSetIcons";
import getMetagameData from "./getMetagameData";
import getScryfallCards from "./getScryfallCards";
import getRanksData from "./getRanksData";
import generateScryfallDatabase from "./generateScryfallDatabase";
import { Metadata } from "mtgatool-shared";
import { ranksData } from "./utils/globals";

console.log(APPDATA);

let metagameData: Metadata["archetypes"] | undefined = undefined;

const OutDIr = "./" + OUTPUT;
if (!fs.existsSync(OutDIr)) {
  fs.mkdirSync(OutDIr);
}

console.log("Begin Metadata fetch.");

getArenaVersion("VIP")
  .then((version) => getManifestFiles(version))
  .then(getRanksData)
  .then(getScryfallCards)
  .then(getMetagameData)
  .then((data) => {
    metagameData = data;
    getSetIcons();
  })
  .then(generateScryfallDatabase)
  .then((data) =>
    generateMetadata(data, ranksData, metagameData, VERSION, LANGUAGES)
  )
  .then(quit);

function quit() {
  console.log("Goodbye!!!");
  process.exit();
}

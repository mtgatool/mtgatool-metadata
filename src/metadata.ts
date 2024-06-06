import fs from "fs";
import _ from "lodash";

import { getArenaVersion, getManifestFiles } from "./manifest-parser";
import { generateMetadata } from "./metadata-generator";

import { APPDATA, OUTPUT, VERSION, LANGUAGES } from "./metadata-constants";

import getSetIcons from "./getSetIcons";

import getRanksData from "./getRanksData";

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

getArenaVersion("VIP")
  .then(getManifestFiles)
  .then(getRanksData)
  .then(getSetIcons)
  .then(() => generateMetadata(ranksData, VERSION, LANGUAGES))
  .then(quit);

function quit() {
  console.log("Goodbye!!!");
  process.exit();
}

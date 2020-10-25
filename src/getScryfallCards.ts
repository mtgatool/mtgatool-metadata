import path from "path";
import fs from "fs";
import _ from "lodash";
import { APPDATA, EXTERNAL, SCRYFALL_FILE } from "./metadata-constants";
import httpGetTextAsync from "./utils/httpGetTextAsync";
import { BulkDataResponse } from "./types/metadata";
import httpGetFileWIthProgres from "./utils/httpGetFileWIthProgres";

export default function getScryfallCards(): Promise<void> {
  return new Promise((resolve) => {
    const file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);
    if (!fs.existsSync(file)) {
      httpGetTextAsync("https://api.scryfall.com/bulk-data").then((str) => {
        const bulkData: BulkDataResponse = JSON.parse(str);
        let downloadURL = undefined;
        bulkData.data.forEach((data) => {
          if (data.type == "all_cards") {
            downloadURL = data.download_uri;
          }
        });
        if (downloadURL) {
          console.log("Downloading Scryfall cards data.");
          httpGetFileWIthProgres(downloadURL, SCRYFALL_FILE).then((_file) => {
            resolve();
          });
        } else {
          console.log("Could not download Scryfall cards data.");
          resolve();
        }
      });
    } else {
      console.log("Skipping Scryfall cards data download.");
      resolve();
    }
  });
}

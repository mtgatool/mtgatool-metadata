import http from "https";
import path from "path";
import fs from "fs";
import zlib from "zlib";

import { APPDATA, EXTERNAL } from "./metadata-constants";
import { ArenaVersion, ManifestJSON } from "./types/parser";
import httpGetText from "./utils/httpGetText";
import downloadManifest from "./downloadManifest";
import { pickManifest } from "./pickManifest";
import requestManifestData from "./requestManifestData";

export function getArenaVersion(channel = "Live"): Promise<string> {
  return new Promise((resolve) => {
    const req = httpGetText(
      `https://mtgarena.downloads.wizards.com/${channel}/Windows32/version`
    );
    req.addEventListener("load", function () {
      try {
        const versionData: ArenaVersion = JSON.parse(req.responseText);
        let versionNumber = "";
        let versionDate = "01/01/00";
        Object.keys(versionData.Versions).forEach((version) => {
          const date = versionData.Versions[version];
          if (new Date(date) > new Date(versionDate)) {
            versionDate = versionData.Versions[version];
            versionNumber = version;
          }
        });
        console.log(versionNumber, versionDate);
        resolve(versionNumber);
      } catch (e) {
        throw e;
      }
    });
  });
}

export function getManifestFiles(version: string): Promise<string[]> {
  return requestManifestData(version)
    .then((data) => downloadManifest(data))
    .then((manifests) => pickManifest(manifests))
    .then((data) => processManifest(data));
}

function processManifest(data: ManifestJSON): Promise<string[]> {
  if (!data) return Promise.reject("No data");
  const requests = data.Assets.filter((asset) => {
    return asset.AssetType == "Data";
  }).map((asset) => {
    const assetUrl = `https://assets.mtgarena.wizards.com/${asset.Name}`;

    const regex = new RegExp("_(.*)_", "g").exec(asset.Name);
    const assetName = regex ? regex[1] : "";

    return new Promise((resolve) => {
      const assetUri = path.join(APPDATA, EXTERNAL, assetName + ".json");

      const dir = path.join(APPDATA, EXTERNAL);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      const out = fs.createWriteStream(assetUri);
      http.get(assetUrl, (response) => {
        response.pipe(zlib.createGunzip()).pipe(out);

        response.on("end", function () {
          resolve(assetName);
        });
      });
    }) as Promise<string>;
  });

  return Promise.all(requests);
}

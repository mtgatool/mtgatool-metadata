import http from "https";
import path from "path";
import fs from "fs";
import zlib from "zlib";

import Database from "better-sqlite3";

import { APPDATA, EXTERNAL } from "./metadata-constants";
import { ArenaVersion, ManifestJSON } from "./types/parser";
import httpGetText from "./utils/httpGetText";
import downloadManifest from "./downloadManifest";
import { pickManifest } from "./pickManifest";
import requestManifestData from "./requestManifestData";

import asyncSleep from "./asyncSleep";

export function getArenaVersion(channel = "Live"): Promise<string> {
  return new Promise((resolve) => {
    const req = httpGetText(
      `https://mtgarena.downloads.wizards.com/${channel}/Windows64/version`
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
    .then((data) => processManifest(data))
    .then(asyncSleep<string[]>(1000))
    .then((data) => extractSqlite(data));
}

function processManifest(data: ManifestJSON): Promise<string[]> {
  if (!data) return Promise.reject("No data");
  const requests = data.Assets.filter((asset) => {
    return asset.AssetType == "Raw" || asset.Name.startsWith("ALT_Booster_");
  }).map((asset) => {
    const assetUrl = `https://assets.mtgarena.wizards.com/${asset.Name}${
      asset.wrapper ? "." + asset.wrapper : ""
    }`;

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
        if (asset.wrapper === "gz") {
          response.pipe(zlib.createGunzip()).pipe(out);
        } else {
          response.pipe(out);
        }

        response.on("end", function () {
          resolve(assetName);
        });

        response.on("error", Promise.reject);
      });
    }) as Promise<string>;
  });

  return Promise.all(requests);
}

function extractSqlite(data: string[]): Promise<string[]> {
  const cardsdbPath = path.join(APPDATA, EXTERNAL, "CardDatabase.json");

  console.log("Extracting CardsDatabase SQLITE");
  console.log(cardsdbPath);
  console.log("CardDatabase.json exists?", fs.existsSync(cardsdbPath));

  return new Promise((resolve, reject) => {
    const db = Database(cardsdbPath);

    const locPromise = new Promise<boolean>((resolve) => {
      const data = db.prepare(`SELECT * FROM Localizations`).all();
      fs.writeFile(
        path.join(APPDATA, EXTERNAL, "loc.json"),
        JSON.stringify(data),
        () => resolve(true)
      );
    });

    const abilitiesPromise = new Promise<boolean>((resolve) => {
      const data = db.prepare(`SELECT * FROM Abilities`).all();
      fs.writeFile(
        path.join(APPDATA, EXTERNAL, "abilities.json"),
        JSON.stringify(data),
        () => resolve(true)
      );
    });

    const enumPromise = new Promise<boolean>((resolve) => {
      const data = db.prepare(`SELECT * FROM Enums`).all();
      fs.writeFile(
        path.join(APPDATA, EXTERNAL, "enums.json"),
        JSON.stringify(data),
        () => resolve(true)
      );
    });

    const cardsPromise = new Promise<boolean>((resolve) => {
      const data = db.prepare(`SELECT * FROM Cards`).all();
      fs.writeFile(
        path.join(APPDATA, EXTERNAL, "cards.json"),
        JSON.stringify(data),
        () => resolve(true)
      );
    });

    Promise.all([cardsPromise, locPromise, abilitiesPromise, enumPromise]).then(
      () => {
        db.close();
        console.log("Extracted all sqlite files.");
        resolve(data);
      }
    );
  });
}

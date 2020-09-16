import http from "https";
import path from "path";
import fs from "fs";
import { XMLHttpRequest } from "xmlhttprequest-ts";
import zlib from "zlib";

import { APPDATA, EXTERNAL } from "./metadata-constants";

interface ArenaVersion {
  VersionURL: string;
  Versions: Record<string, string>;
  CurrentPatchURL: string;
  Flavor: string;
  ProductCode: string;
  CurrentInstallerURL: string;
  Name: string;
  BinaryURL: string;
  FileCount: string;
}

export function getArenaVersion(channel = "VIP"): Promise<string> {
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

interface Data {
  url: string;
  file: string;
  id: string;
}

function requestManifestData(version: string): Promise<Data[]> {
  return new Promise((resolve) => {
    // Regex to extract version number
    const reg = new RegExp(/.\..\.(.+\..+)/g).exec(version);
    version = reg ? reg[1].replace(".", "_") : "";
    console.log("Version:", version);
    const externalURL = `https://assets.mtgarena.wizards.com/External_${version}.mtga`;
    console.log("Manifest external URL:", externalURL);

    const req = httpGetText(externalURL);
    req.addEventListener("load", function () {
      const manifests = req.responseText.split(`\r\n`);
      const data: Data[] = [];
      manifests.map((manifestId) => {
        console.log("Manifest ID:", manifestId);
        const manifestUrl = `https://assets.mtgarena.wizards.com/Manifest_${manifestId}.mtga`;
        const manifestFile = `Manifest_${manifestId}.mtga`;
        data.push({ url: manifestUrl, file: manifestFile, id: manifestId });
      });
      resolve(data);
    });
  });
}

function downloadManifest(data: Data[]): Promise<string[]> {
  if (!data) return Promise.all([""]);
  const promises: Promise<string>[] = data.map((manifestData) => {
    return new Promise((resolve) => {
      if (!manifestData) {
        resolve("");
      } else {
        console.log(manifestData.url);
        httpGetFile(manifestData.url, manifestData.file).then((_file) => {
          const outFile = path.join(
            APPDATA,
            EXTERNAL,
            `manifest_${manifestData.id}.json`
          );
          const fileBuffer = fs.readFileSync(_file);
          try {
            JSON.parse(fileBuffer.toString("utf-8"));
            resolve(outFile);
          } catch (e) {
            console.log("Trying to gunzip manifest..");
            zlib.gunzip(fileBuffer, function (err, result) {
              if (err) return console.error(err);
              fs.writeFileSync(outFile, result);
              resolve(outFile);
            });
          }
        });
      }
    });
  });
  return Promise.all(promises);
}

interface ManifestJSON {
  FormatVersion: number;
  EncryptionKey: boolean;
  Assets: {
    Name: string;
    AssetType: string;
    Length: number;
    CompressedLength: number;
    Priority: number;
    Hash: string;
    MD5: string;
    Dependencies: [];
    IndexedAssets: string[];
    AllowDecryption: boolean;
  }[];
}

function pickManifest(manifests: string[]): Promise<ManifestJSON> {
  console.log(manifests);
  return new Promise((resolve) => {
    const sizes = manifests.map((file) => {
      const stat = fs.statSync(file);
      return stat.size;
    });
    const biggest = sizes.indexOf(Math.max(...sizes));
    const str = fs.readFileSync(manifests[biggest]).toString("utf-8");
    const manifestData: ManifestJSON = JSON.parse(str);
    resolve(manifestData);
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

function httpGetText(url: string): XMLHttpRequest {
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url);
  xmlHttp.send();
  return xmlHttp;
}

function httpGetFile(url: string, file: string): Promise<string> {
  return new Promise((resolve) => {
    file = path.join(APPDATA, EXTERNAL, file);

    const dir = path.join(APPDATA, EXTERNAL);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const stream = fs.createWriteStream(file);
    http.get(url, (response) => {
      response.pipe(stream);
      response.on("end", function () {
        resolve(file);
      });
    });
  });
}

import httpGetFile from "./httpGetFile";
import { APPDATA, EXTERNAL } from "./metadata-constants";
import { Data } from "./types/parser";
import path from "path";
import fs from "fs";
import zlib from "zlib";

export default function downloadManifest(data: Data[]): Promise<string[]> {
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

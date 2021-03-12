import httpGetFile from "./utils/httpGetFile";
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
          fs.readFile(_file, (err, fileBuffer) => {
            console.log("Trying to gunzip manifest..");
            if (err) console.error(err);
            else {
              try {
                JSON.parse(fileBuffer.toString("utf-8"));
                resolve(outFile);
              } catch (e) {
                zlib.gunzip(fileBuffer, function (err, result) {
                  if (err) return console.error(err);
                  fs.writeFileSync(outFile, result);
                  resolve(outFile);
                });
              }
            }
          });
        });
      }
    });
  });
  return Promise.all(promises);
}

import fs from "fs";
import { ManifestJSON } from "./types/parser";

export function pickManifest(manifests: string[]): Promise<ManifestJSON> {
  console.log("manifests: ", manifests);
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

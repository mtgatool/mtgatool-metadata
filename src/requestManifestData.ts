import httpGetText from "./httpGetText";
import { Data } from "./types/parser";

export default function requestManifestData(version: string): Promise<Data[]> {
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

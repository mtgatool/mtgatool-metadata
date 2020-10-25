import { APPDATA, EXTERNAL } from "./metadata-constants";

import path from "path";
import fs from "fs";
import http from "https";

export default function httpGetFile(
  url: string,
  file: string
): Promise<string> {
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

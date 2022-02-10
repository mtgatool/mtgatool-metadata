import fs from "fs";
import path from "path";
import request from "request";
import { APPDATA, EXTERNAL } from "../metadata-constants";

export default function httpGetFileWIthProgres(
  file_url: string,
  filename: string,
  stdout = true
): Promise<string> {
  return new Promise((resolve) => {
    const file = path.join(APPDATA, EXTERNAL, filename);
    const dir = path.join(APPDATA, EXTERNAL);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    // Save variable to know progress
    let received_bytes = 0;
    const req = request({
      method: "GET",
      uri: file_url,
    });

    const out = fs.createWriteStream(file);
    req.pipe(out);

    req.on("data", function (chunk) {
      // Update the received bytes
      received_bytes += chunk.length;
      if (stdout && !process.env.GITHUB_ACTIONS) {
        process.stdout.cursorTo(0);
        process.stdout.write(
          `Downloading ${filename}:\t ${
            Math.round((received_bytes / 1024 / 1024) * 100) / 100
          }Mb`
        );
      }
    });

    req.on("end", function () {
      if (stdout) {
        process.stdout.write("Done!\r");
      }
      resolve(file);
    });
  });
}

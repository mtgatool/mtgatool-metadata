import { APPDATA, OUTPUT, VERSION } from "./metadata-constants";
import path from "path";
import fs from "fs";

const databaseVersion = VERSION;

const latestJson = path.join(APPDATA, "latest.json");
const latestJsonOutput = path.join(APPDATA, OUTPUT, "latest.json");

fs.readFile(latestJson, "utf8", function (err, data) {
  if (err) {
    return console.log(err);
  }
  const json = JSON.parse(data);
  json.version = databaseVersion;

  fs.writeFile(latestJsonOutput, JSON.stringify(json), "utf8", function (err) {
    if (err) {
      console.log(err);
      process.exit();
      return;
    } else {
      console.log("Updated latest.json");
      process.exit();
      return;
    }
  });
});

import { APPDATA, OUTPUT, VERSION } from "./metadata-constants";
import path from "path";
import fs from "fs";
import Client from "ssh2-sftp-client";

const sftp = new Client();

const databaseVersion = VERSION;
const remoteDir = "/var/www/html/database/" + databaseVersion + "/";
const outDir = path.join(APPDATA, OUTPUT);
const latestJson = path.join(APPDATA, "latest.json");

fs.readFile(latestJson, "utf8", function (err, data) {
  if (err) {
    return console.log(err);
  }
  const json = JSON.parse(data);
  json.version = databaseVersion;

  fs.writeFile(latestJson, JSON.stringify(json), "utf8", function (err) {
    if (err) {
      return console.log(err);
    } else {
      console.log("Updated latest.json");
      doScan();
    }
  });
});

function doScan() {
  fs.readdir(outDir, function (err, files) {
    //handling error
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    try {
      doPush(files);
    } catch (err) {
      console.log(err, "catch error");
      process.exit();
    }
  });
}

async function doPush(files: string[]) {
  await sftp.connect({
    host: "mtgatool.com",
    port: 5718,
    username: "database_ftp",
    password: process.env.SFTP_KEY,
  });

  console.log("Creating directory (" + databaseVersion + ")");
  try {
    await sftp.mkdir(remoteDir, true);
  } catch (e) {
    console.log(
      "if version already exists existing databases will be replaced."
    );
  }

  console.log("CHMOD..");
  await sftp.chmod(remoteDir, 0o755);

  console.log("Begin upload.");

  await files.reduce(async (prevUpload, nextFile) => {
    await prevUpload;
    return uploadFile(nextFile);
  }, Promise.resolve(""));

  console.log("Uploading new latest.json");
  const remoteImport = "/var/www/html/database/latest.json";
  await sftp.delete(remoteImport);
  await sftp.put(latestJson, remoteImport, { mode: 0o644 });

  console.log("All done, bye bye!");
  process.exit();
}

function uploadFile(file: string): Promise<string> {
  const filePath = path.join(APPDATA, OUTPUT, file);
  console.log("Uploading " + file);
  return sftp.put(filePath, remoteDir + file, { mode: 0o644 });
}

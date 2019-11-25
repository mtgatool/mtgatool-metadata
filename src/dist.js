const {
  APPDATA,
  OUTPUT
} = require("./metadata-constants");

const path = require("path");
const fs = require("fs");
let Client = require('ssh2-sftp-client');
let sftp = new Client();

packageJson = require('../package.json');
const databaseVersion = packageJson.version.split(".")[0];
const remoteDir = "/var/www/html/database/" + databaseVersion + "/";
const localDir = path.join(APPDATA, OUTPUT);

fs.readdir(localDir, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }

    try {
      doPush(files);
    } catch (err) {
      console.log(err, 'catch error');
    }
});

async function doPush(files) {
  await sftp.connect({
    host: "mtgatool.com",
    port: "5718",
    username: "database_ftp",
    password: process.env.SFTP_KEY
  });
  console.log("Creating directory (" + databaseVersion + ")");
  await sftp.mkdir(remoteDir, true);
  
  console.log("CHMOD..");
  await sftp.chmod(remoteDir, 0o755);

  console.log("Begin upload.");
  files.reduce( async (prevUpload, nextFile) => {
    await prevUpload;
    return uploadFile(nextFile);
  }, Promise.resolve());

  console.log("All done, bye bye!");
}

function uploadFile(file) {
  let filePath = path.join(APPDATA, OUTPUT, file);
  console.log("Uploading " + file);
  return sftp.put(filePath, remoteDir + file, {mode: 0o644});
}
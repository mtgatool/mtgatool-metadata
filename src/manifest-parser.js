var http = require("https");
const path = require("path");
const fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const gunzip = require("gunzip-file");

const {
  APPDATA,
  EXTERNAL
} = require("./metadata-constants");

function getArenaVersion(channel = "Live") {
  return new Promise(resolve => {
    let req = httpGetText(`https://mtgarena.downloads.wizards.com/${channel}/Windows32/version`);
    req.addEventListener("load", function() {
      try {
        let versionData = JSON.parse(req.responseText);
        let versionNumber = "";
        let versionDate = "01/01/00";
        Object.keys(versionData.Versions).forEach(version => {
          let date = versionData.Versions[version];
          if (new Date(date) > new Date(versionDate)) {
            versionDate = versionData.Versions[version];
            versionNumber = version;
          }
        })
        console.log(versionNumber, versionDate);
        resolve(versionNumber);

      } catch (e) {
        throw (e)
      }
    });
  });
};

function requestManifestData(version) {
  return new Promise(resolve => {
    /*
    // Split manifest files make it so we need to request everything again each time
    let requiredFiles = [
      "abilities.json",
      "cards.json",
      "prompts.json",
      "loc.json",
      "enums.json"
    ];
    requiredFiles = requiredFiles.filter(file => {
      let assetUri = path.join(APPDATA, EXTERNAL, file);
      return !fs.existsSync(assetUri);
    });

    if (requiredFiles.length == 0) {
      console.log("All manifest files available, skipping manifest.");
      resolve(false);
      return;
    }
    */
    // Regex to extract version number
    const regExp = /.\..\.(.+\..+)/g;
    version = regExp.exec(version)[1].replace(".", "_");
    console.log("Version:", version);
    let externalURL = `https://assets.mtgarena.wizards.com/External_${version}.mtga`;
    console.log("Manifest external URL:", externalURL);

    let req = httpGetText(externalURL);
    req.addEventListener("load", function() {
      let manifests = req.responseText.split(`\r\n`);
      const data = [];
      manifests.map(manifestId => {
        console.log("Manifest ID:", manifestId);
        let manifestUrl = `https://assets.mtgarena.wizards.com/Manifest_${manifestId}.mtga`;
        let manifestFile = `Manifest_${manifestId}.mtga`;
        data.push({ url: manifestUrl, file: manifestFile, id: manifestId });
      });
      resolve(data);
    });
  });
}

function downloadManifest(data) {
  if (!data) return Promise.all([""]);
  const promises = data.map(manifestData => {
    return new Promise(resolve => {
      if (!manifestData) {
        resolve(false);
      } else {
        httpGetFile(manifestData.url, manifestData.file).then(file => {
          let outFile = path.join(APPDATA, EXTERNAL, `manifest_${manifestData.id}.json`);
          try {
            JSON.parse(fs.readFileSync(outFile));
            resolve(outFile);
          } catch (e) {
            console.log("Trying to gunzip manifest..");
            gunzip(file, outFile, () => {
              fs.unlink(file, () => {});
              JSON.parse(fs.readFileSync(outFile));
              resolve(outFile);
            });
          }
        });
      }
    });
  });
  return Promise.all(promises);
}

function pickManifest(manifests) {
  console.log(manifests);
  return new Promise(resolve => {
    const sizes = manifests.map(file => {
      const stat = fs.statSync(file);
      return stat.size;
    });
    const biggest = sizes.indexOf(Math.max(...sizes));
    const manifestData = JSON.parse(fs.readFileSync(manifests[biggest]));
    resolve(manifestData);
  });
}

function getManifestFiles(version) {
  return requestManifestData(version)
    .then(data => downloadManifest(data))
    .then(manifests => pickManifest(manifests))
    .then(data => processManifest(data))
}

function processManifest(data) {
  if (!data) return false;
  let requests = data.Assets.filter(asset => {
    return asset.AssetType == "Data";
  }).map(asset => {
    let assetUrl = `https://assets.mtgarena.wizards.com/${asset.Name}`;

    let regex = new RegExp("_(.*)_", "g");
    let assetName = regex.exec(asset.Name)[1];

    return new Promise(resolve => {
      let assetUriGz = path.join(APPDATA, EXTERNAL, assetName + ".gz");
      let assetUri = path.join(APPDATA, EXTERNAL, assetName + ".json");

      let dir = path.join(APPDATA, EXTERNAL);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      let stream = fs.createWriteStream(assetUriGz);
      http.get(assetUrl, response => {
        response.pipe(stream);

        response.on("end", function() {
          gunzip(assetUriGz, assetUri, function() {
            console.log("Downloaded and unzipped " + assetUriGz);
            resolve(assetName);
          });
        });
      });
    });
  });

  return Promise.all(requests);
}

function httpGetText(url) {
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url);
  xmlHttp.send();
  return xmlHttp;
}

function httpGetFile(url, file) {
  return new Promise(resolve => {
    file = path.join(APPDATA, EXTERNAL, file);

    let dir = path.join(APPDATA, EXTERNAL);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    let stream = fs.createWriteStream(file);
    http.get(url, response => {
      response.pipe(stream);
      response.on("end", function() {
        resolve(file);
      });
    });
  });
}

module.exports = {
  getManifestFiles: getManifestFiles,
  getArenaVersion: getArenaVersion
};

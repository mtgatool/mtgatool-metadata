const path = require("path");
const fs = require("fs");
var http = require("https");
const readline = require("readline");
const _ = require("lodash");

const manifestParser = require("./manifest-parser");
const {generateMetadata} = require("./metadata-generator");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const {
  APPDATA,
  EXTERNAL,
  OUTPUT,
  VERSION,
  LANGUAGES,
  RANKS_SHEETS,
  SETS_DATA,
  CID_ART_SETS,
  NO_DUPES_ART_SETS,
  ALLOWED_SCRYFALL,
  ARENA_SVG,
  RATINGS_MTGCSR,
  RATINGS_LOLA,
} = require("./metadata-constants");

let metagameData = {};
let ranksData = {};

console.log(APPDATA);

// "scryfall-all-cards.json" contains cards in all languages but is 800+mb
const SCRYFALL_FILE = "scryfall-all-cards.json";
const OutDIr = "./" + OUTPUT;
if (!fs.existsSync(OutDIr)) {
  fs.mkdirSync(OutDIr);
}

console.log("Begin Metadata fetch.");
manifestParser
  .getArenaVersion()
  .then((version) => manifestParser.getManifestFiles(version))
  .then(getRanksData)
  .then(getScryfallCards)
  .then(getMetagameData)
  .then(getSetIcons)
  .then(generateScryfallDatabase)
  .then((data) =>
    generateMetadata(data, ranksData, metagameData, VERSION, LANGUAGES)
  )
  .then(quit);

function quit() {
  console.log("Goodbye!!!");
  process.exit();
}

function getRanksData() {
  let requests = RANKS_SHEETS.map((rank) => {
    return new Promise((resolve) => {
      console.log(`Get ${rank.setCode.toUpperCase()} ranks data.`);
      httpGetFile(
        `https://docs.google.com/spreadsheets/d/${rank.sheet}/gviz/tq?sheet=${rank.page}`,
        rank.setCode + "_ranks"
      ).then((file) => {
        fs.readFile(file, function read(err, data) {
          let str = data.toString();
          str = str
            .replace("/*O_o*/", "")
            .replace(`google.visualization.Query.setResponse(`, "")
            .replace(`);`, " ");

          console.log(`${rank.setCode.toUpperCase()} ok.`);
          resolve();
          try {
            ranksData[rank.setCode.toUpperCase()] = processRanksData(
              str,
              rank.source
            );
          } catch (e) {
            console.log("Error processing " + rank.setCode, e);
          }
        });
      });
    });
  });

  return Promise.all(requests);
}

function processRanksData(str, source) {
  let data = JSON.parse(str);
  let ret = {};
  if (source == RATINGS_MTGCSR) {
    data.table.rows.forEach((row) => {
      let name = row.c[0].v;
      let rank = Math.round(row.c[4].v);
      let cont = Math.round(row.c[5].v);
      let values = [
        row.c[9].v,
        row.c[10].v,
        row.c[11].v,
        row.c[12].v,
        row.c[13].v,
        row.c[14].v,
        row.c[15].v,
        row.c[16].v,
        row.c[17].v,
        row.c[18].v,
        row.c[19].v,
        row.c[20].v,
        row.c[21].v,
      ];
      ret[name] = {rankSource: source, rank: rank, cont: cont, values: values};
    });
  }
  if (source == RATINGS_LOLA) {
    data.table.rows.forEach((row) => {
      let name = row.c[0].v;
      let rank = row.c[10].v;
      let side = row.c[5] ? true : false;
      let ceil = row.c[4] ? row.c[4].v : rank;
      let values = [row.c[1].v, row.c[2].v, row.c[3].v];
      ret[name] = {
        rankSource: source,
        rank: Math.round(rank),
        side: side,
        ceil: Math.round(ceil),
        values: values,
      };
    });
  }

  return ret;
}

function getMetagameData() {
  return new Promise((resolve) => {
    let req = httpGetText("https://mtgatool.com/database/metagame.php");
    console.log("Download metagame data.");
    req.addEventListener("load", function () {
      let json = JSON.parse(`{"metagame": ${req.responseText} }`);
      metagameData = json.metagame;
      resolve();
    });
  });
}

function getSetIcons() {
  return new Promise((resolve) => {
    let count = 0;
    let setNames = Object.keys(SETS_DATA);
    setNames.forEach((setName, index) => {
      setTimeout(() => {
        let code = SETS_DATA[setName].scryfall;
        if (setName == "" || setName == "Arena New Player Experience") {
          // hack hack hack
          // for some reason, scryfall does not provide this yet
          // manually insert here instead
          str = ARENA_SVG;
          str = str.replace(/fill="#.*?\"\ */g, " ");
          str = str.replace(/<path /g, '<path fill="#FFF" ');
          SETS_DATA[setName].svg = Buffer.from(str).toString("base64");
          resolve();
          code = "default";
        }
        if (setName == "M19 Gift Pack") code = "m19";

        let setUri = `https://api.scryfall.com/sets/${code}`;
        if (code !== "default") {
          httpGetTextAsync(setUri).then((setStr) => {
            const set = JSON.parse(setStr);
            SETS_DATA[setName].release = set.released_at;
            let svgUrl = set.icon_svg_uri;
            httpGetTextAsync(svgUrl).then((str) => {
              count++;
              str = str.replace(/fill="#.*?\"\ */g, " ");
              str = str.replace(/<path /g, '<path fill="#FFF" ');
              //console.log(setName, code, str);
              SETS_DATA[setName].svg = Buffer.from(str).toString("base64");
              if (count == setNames.length) {
                resolve();
              }
            });
          }, 300 * index);
        }
      });
    });
  });
}

function getScryfallCards() {
  return new Promise((resolve) => {
    let file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);
    if (!fs.existsSync(file)) {
      httpGetTextAsync("https://api.scryfall.com/bulk-data").then((str) => {
        const bulkData = JSON.parse(str);
        let downloadURL = undefined;
        bulkData.data.forEach((data) => {
          if (data.type == "all_cards") {
            downloadURL = data.download_uri;
          }
        });
        if (downloadURL) {
          console.log("Downloading Scryfall cards data.");
          httpGetFile(downloadURL, SCRYFALL_FILE).then((file) => {
            resolve();
          });
        } else {
          console.log("Could not download Scryfall cards data.");
          resolve();
        }
      });
    } else {
      console.log("Skipping Scryfall cards data download.");
      resolve();
    }
  });
}

function generateScryfallDatabase() {
  return new Promise((resolve) => {
    console.log("Processing Scryfall database.");
    let file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);

    fs.stat(file, function (err, stats) {
      var fileSize = stats.size;
      var readSize = 0;
      var stream = fs.createReadStream(file, {flags: "r", encoding: "utf-8"});
      var buf = "";

      // We read the file as a stream, decoding line by line because decoding
      // such a huge file in JS causes the GC to go craz yand crash for me.
      // The only problem may be if Scryfall changes its files and stops
      // using the newline characters..

      let scryfallData = {};
      let scryfallDataAdd = function (obj, lang, set, name, cid = false) {
        if (scryfallData[lang] == undefined) scryfallData[lang] = {};
        if (scryfallData[lang][set] == undefined) scryfallData[lang][set] = {};
        if (
          scryfallData[lang][set][name] == undefined &&
          !CID_ART_SETS.includes(set)
        )
          scryfallData[lang][set][name] = {};

        if (CID_ART_SETS.includes(set)) {
          scryfallData[lang][set][cid] = obj;
        } else if (NO_DUPES_ART_SETS.includes(set)) {
          scryfallData[lang][set][name] = obj;
        } else {
          scryfallData[lang][set][name][cid] = obj;
        }
      };

      let pump = function () {
        var pos;

        while ((pos = buf.indexOf("\n")) >= 0) {
          // keep going while there's a newline somewhere in the buffer
          if (pos == 0) {
            // if there's more than one newline in a row, the buffer will now start with a newline
            buf = buf.slice(1); // discard it
            continue; // so that the next iteration will start with data
          }
          processLine(buf.slice(0, pos)); // hand off the line
          buf = buf.slice(pos + 1); // and slice the processed data off the buffer
        }
      };

      let processLine = function (line) {
        // here's where we do something with a line

        if (line[line.length - 1] == "\r")
          line = line.substr(0, line.length - 1); // discard CR (0x0D)

        line = line.slice(0, -1);

        if (line.length > 0) {
          try {
            var obj = JSON.parse(line);
            /*if (obj.set == "eld" && obj.collector_number == 149) {
              console.log(line);
            }*/
            if (ALLOWED_SCRYFALL.includes(obj.set)) {
              obj.lang = obj.lang.toUpperCase();
              if (obj.lang == "PH") {
                console.log(obj);
              }
              let name = obj.name;
              scryfallDataAdd(
                obj,
                obj.lang,
                obj.set,
                name,
                obj.collector_number
              );
              if (obj.layout == "adventure") {
                obj.card_faces.forEach((face) => {
                  let name = face.name;
                  let newObj = Object.assign(_.cloneDeep(obj), face);
                  scryfallDataAdd(
                    newObj,
                    obj.lang,
                    obj.set,
                    name,
                    obj.collector_number
                  );
                });
              }
              if (obj.layout == "transform") {
                obj.card_faces.forEach((face) => {
                  let name = face.name;
                  let newObj = Object.assign(_.cloneDeep(obj), face);
                  scryfallDataAdd(
                    newObj,
                    obj.lang,
                    obj.set,
                    name,
                    obj.collector_number
                  );
                });
              }
              if (obj.layout == "split") {
                obj.card_faces.forEach((face) => {
                  let name = face.name;
                  let newObj = Object.assign(_.cloneDeep(obj), face);
                  scryfallDataAdd(
                    newObj,
                    obj.lang,
                    obj.set,
                    name,
                    obj.collector_number
                  );
                });
              }
            }
          } catch (e) {
            //console.log(e);
          }
        }
      };

      stream.on("data", function (d) {
        var dataLength = d.length;
        readSize += dataLength;
        buf += d.toString(); // when data is read, stash it in a string buffer
        pump(); // then process the buffer
      });

      stream.on("end", function () {
        resolve(scryfallData);
      });
    });
  });
}

function httpGetText(url) {
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url);
  xmlHttp.send();
  return xmlHttp;
}

function httpGetTextAsync(url) {
  return new Promise((resolve) => {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url);
    xmlHttp.send();

    xmlHttp.addEventListener("load", function () {
      resolve(xmlHttp.responseText);
    });
  });
}

function httpGetFile(url, filename) {
  return new Promise((resolve) => {
    let file = path.join(APPDATA, EXTERNAL, filename);
    /*
    if (fs.existsSync(file)) {
      resolve(file);
      return;
    }*/

    let dir = path.join(APPDATA, EXTERNAL);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    let stream = fs.createWriteStream(file);
    http.get(url, (response) => {
      response.pipe(stream);
      let data = "";

      let timeStart = new Date();
      response.on("data", function (chunk) {
        if (new Date() - timeStart > 2000) {
          timeStart = new Date();
          console.log(
            `Downloading ${filename}:\t ${(data.length / 1024 / 1024).toFixed(
              2
            )} mb`
          );
        }
      });
      response.on("end", function () {
        resolve(file);
      });
    });
  });
}

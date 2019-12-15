const path = require("path");
const fs = require("fs");
var http = require("https");
const readline = require("readline");
const _ = require("lodash");

const manifestParser = require("./manifest-parser");
const { generateMetadata } = require("./metadata-generator");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const {
  APPDATA,
  EXTERNAL,
  OUTPUT,
  VERSION,
  LANGUAGES,
  RANKS_SHEETS,
  SETS_DATA,
  NO_DUPES_ART_SETS,
  ALLOWED_SCRYFALL
} = require("./metadata-constants");

let metagameData = {};
let ranksData = {};

console.log(APPDATA);

// "scryfall-all-cards.json" contains cards in all languages but is 800+mb
const SCRYFALL_FILE = "scryfall-all-cards.json";
const OutDIr = './' + OUTPUT;
if (!fs.existsSync(OutDIr)){
    fs.mkdirSync(OutDIr);
}

console.log("Begin Metadata fetch.");
// It would be nice if we could suppy the version manually or
// obtain it from somewhere automatically, like a settings
// file or the output log itself.
manifestParser
  .getArenaVersion()
  .then(version =>
    manifestParser.getManifestFiles(version)
  )
  .then(getRanksData)
  .then(getScryfallCards)
  .then(getMetagameData)
  .then(getSetIcons)
  .then(generateScryfallDatabase)
  .then(data =>
    generateMetadata(data, ranksData, metagameData, VERSION, LANGUAGES)
  )
  .then(quit);

function quit() {
  console.log("Goodbye!!!");
  process.exit()
}

function getRanksData() {
  let requests = RANKS_SHEETS.map(rank => {
    return new Promise(resolve => {
      console.log(`Get ${rank.setCode.toUpperCase()} ranks data.`);
      httpGetFile(
        `https://docs.google.com/spreadsheets/d/${rank.sheet}/gviz/tq?sheet=${
          rank.page
        }`,
        rank.setCode + "_ranks"
      ).then(file => {
        fs.readFile(file, function read(err, data) {
          let str = data.toString();
          str = str
            .replace("/*O_o*/", "")
            .replace(`google.visualization.Query.setResponse(`, "")
            .replace(`);`, " ");

          console.log(`${rank.setCode.toUpperCase()} ok.`);
          resolve();
          try {
            ranksData[rank.setCode.toUpperCase()] = processRanksData(str);
          } catch (e) {
            console.log("Error processing " + rank.setCode, e);
          }
        });
      });
    });
  });

  return Promise.all(requests);
}

function processRanksData(str) {
  let data = JSON.parse(str);
  let ret = {};
  data.table.rows.forEach(row => {
    let name = row.c[0].v;
    let rank = row.c[4].v;
    let cont = row.c[5].v;
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
      row.c[21].v
    ];
    ret[name] = { rank: rank, cont: cont, values: values };
  });

  return ret;
}

function getMetagameData() {
  return new Promise(resolve => {
    let req = httpGetText("https://mtgatool.com/database/metagame.php");
    console.log("Download metagame data.");
    req.addEventListener("load", function() {
      let json = JSON.parse(`{"metagame": ${req.responseText} }`);
      metagameData = json.metagame;
      resolve();
    });
  });
}

function getSetIcons() {
  return new Promise(resolve => {
    let count = 0;
    let setNames = Object.keys(SETS_DATA);
    setNames.forEach((setName, index) => {
      setTimeout(() => {
        let code = SETS_DATA[setName].scryfall;
        if (setName == "")
          code = "default";
        if (setName == "M19 Gift Pack") code = "m19";

        let svgText = `https://img.scryfall.com/sets/${ code }.svg`;
        httpGetTextAsync(svgText).then(str => {
          count++;
          if (code === "ana") {
            // hack hack hack
            // for some reason, scryfall does not provide this yet
            // manually insert here instead
            str = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 597"><path d="M347.576 239.949c-2.473-55.145-8.067-76.085-11.774-76.085-3.762 0-4.946 30.544-9.89 57.535-4.946 26.929-13.654 57.468-13.654 57.468l-22.256-7.19s-6.24-38.967-8.71-85.665c-2.416-46.7-4.299-87.485-11.184-87.485-6.718-.049-8.007 38.346-10.48 88.1-2.475 49.725-11.126 77.265-11.126 77.265l-20.426-2.414s-9.892-43.13-13.603-174.876c-.86-31.181-9.834-37.438-9.834-37.438s-8.979 6.257-9.839 37.438c-3.707 131.746-13.654 174.876-13.654 174.876l-20.375 2.414s-8.704-27.54-11.177-77.265c-2.473-49.754-3.713-88.149-10.48-88.1-6.83 0-8.713 40.785-11.242 87.485-2.415 46.698-8.6 85.665-8.6 85.665l-22.256 7.19s-8.705-30.54-13.65-57.468c-4.945-26.991-6.184-57.535-9.89-57.535-3.712 0-9.3 20.94-11.774 76.085-2.473 55.075-3.063 65.842-3.063 65.842s73.053 26.398 101.49 94.715c28.491 68.276 35.694 127.56 35.909 134.142.373 10.216 8.6 11.516 8.6 11.516s7.152-1.3 8.602-11.516c.912-6.535 7.417-65.866 35.904-134.142 28.441-68.317 101.495-94.715 101.495-94.715s-.594-10.767-3.063-65.842"></path><path d="M273.537 0c-9.573 8.966-7.488 17.264 6.254 24.895 20.613 11.445 225.805 465.27 225.805 497.761 0 21.662-6.136 41.568-18.407 59.719-2.14 9.263.392 13.895 7.598 13.895H763.71c5.154 0 5.154-4.632 0-13.895-35.035-33.824-101.34-130.195-258.113-528.172-1.877-16.954 2.127-29.228 12.012-36.82.315-7.19-1.609-12.985-5.77-17.383h-238.3zM4.705 578.738c59.145-76.265 100.637-127.355 100.637-183.566 0-21.385 66.03 30.783 78.899 192.19.13 1.635-.742 4.939-5.343 4.939H4.705c-6.273-3.922-6.273-8.443 0-13.563z"></path></svg>`;
          }
          str = str.replace(/fill="#.*?\"\ */g, ' ');
          str = str.replace(/<path /g, '<path fill="#FFF" ');
          //console.log(setName, code, str);
          SETS_DATA[setName].svg = Buffer.from(str).toString('base64');
          if (count == setNames.length) {
            resolve();
          }
        }, 300 * index);
      });
    });
  });
}

function getScryfallCards() {
  return new Promise(resolve => {
    let file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);
    if (!fs.existsSync(file)) {
      console.log("Downloading Scryfall cards data.");
      httpGetFile(
        "https://archive.scryfall.com/json/" + SCRYFALL_FILE,
        SCRYFALL_FILE
      ).then(file => {
        resolve();
      });
    } else {
      console.log("Skipping Scryfall cards data download.");
      resolve();
    }
  });
}

function generateScryfallDatabase() {
  return new Promise(resolve => {
    console.log("Processing Scryfall database.");
    let file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);

    fs.stat(file, function(err, stats) {
      var fileSize = stats.size;
      var readSize = 0;
      var stream = fs.createReadStream(file, { flags: "r", encoding: "utf-8" });
      var buf = "";

      // We read the file as a stream, decoding line by line because decoding
      // such a huge file in JS causes the GC to go craz yand crash for me.
      // The only problem may be if Scryfall changes its files and stops
      // using the newline characters..

      let scryfallData = {};

      let scryfallDataAdd = function(obj, lang, set, name, cid = false) {
        if (scryfallData[lang] == undefined) scryfallData[lang] = {};
        if (scryfallData[lang][set] == undefined) scryfallData[lang][set] = {};
        if (scryfallData[lang][set][name] == undefined)
          scryfallData[lang][set][name] = {};

        if (NO_DUPES_ART_SETS.includes(set)) {
          scryfallData[lang][set][name] = obj;
        } else {
          scryfallData[lang][set][name][cid] = obj;
        }
      };

      let pump = function() {
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

      let processLine = function(line) {
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
              let name = obj.name;
              scryfallDataAdd(
                obj,
                obj.lang,
                obj.set,
                name,
                obj.collector_number
              );
              if (obj.layout == "adventure") {
                obj.card_faces.forEach(face => {
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
                obj.card_faces.forEach(face => {
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
                obj.card_faces.forEach(face => {
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

      stream.on("data", function(d) {
        var dataLength = d.length;
        readSize += dataLength;
        buf += d.toString(); // when data is read, stash it in a string buffer
        pump(); // then process the buffer
      });

      stream.on("end", function() {
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
  return new Promise(resolve => {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url);
    xmlHttp.send();
    
    xmlHttp.addEventListener("load", function() {
      resolve(xmlHttp.responseText);
    });
  });
}

function httpGetFile(url, filename) {
  return new Promise(resolve => {
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
    http.get(url, response => {
      response.pipe(stream);
      let data = "";

      let timeStart = new Date();
      response.on("data", function(chunk) {
        if (new Date() - timeStart > 2000) {
          timeStart = new Date();
          console.log(`Downloading ${filename}:\t ${(data.length / 1024 / 1024).toFixed(2)} mb`);
        }   
      });
      response.on("end", function() {
        resolve(file);
      });
    });
  });
}

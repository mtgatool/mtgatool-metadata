import path from "path";
import fs from "fs";
import _ from "lodash";

import { getArenaVersion, getManifestFiles } from "./manifest-parser";
import { generateMetadata } from "./metadata-generator";

import {
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
  AKR_SVG,
} from "./metadata-constants";
import CardApiResponse from "scryfall-client/dist/types/api/card";
import { RanksData, SetRanks } from "./types/metadata";
import { ScryfallData } from "./types/scryfall";
import { constants, Metadata } from "mtgatool-shared";
import httpGetFile from "./utils/httpGetFile";
import httpGetText from "./utils/httpGetText";
import httpGetTextAsync from "./utils/httpGetTextAsync";
import MagicSet from "scryfall-client/dist/models/magic-set";
const { RATINGS_LOLA, RATINGS_MTGCSR } = constants;

let metagameData: Metadata["archetypes"] | undefined = undefined;
const ranksData: RanksData = {};

console.log(APPDATA);

// "scryfall-all-cards.json" contains cards in all languages but is 800+mb
const SCRYFALL_FILE = "scryfall-all-cards.json";
const OutDIr = "./" + OUTPUT;
if (!fs.existsSync(OutDIr)) {
  fs.mkdirSync(OutDIr);
}

console.log("Begin Metadata fetch.");

getArenaVersion()
  .then((version) => getManifestFiles(version))
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

function asyncSleep<T>(ms: number): (x: T) => Promise<T> {
  return function (x: T) {
    return new Promise((resolve) => setTimeout(() => resolve(x), ms));
  };
}

function getRanksData() {
  const rankRequests = RANKS_SHEETS.map((r) => {
    return { code: r.setCode, state: 0 };
  });

  const redrawRankRequests = function (moveBack = true) {
    if (process.env.TRAVIS) return;
    process.stdout.moveCursor(0, moveBack ? -rankRequests.length : 0);
    const str = `${rankRequests
      .map((r) => {
        let bg = "\x1b[41m";
        if (r.state == 1) bg = "\x1b[42m";
        if (r.state == -1) bg = "\x1b[45m";
        return bg + "\x1b[30m " + r.code.toUpperCase() + " \x1b[0m\n";
      })
      .join("")}`;
    process.stdout.write(str);
  };

  const setRankRequestState = function (code: string, state: number) {
    rankRequests.forEach((r, index) => {
      if (r.code == code) {
        rankRequests[index].state = state;
      }
    });
    redrawRankRequests();
  };

  console.log("Get draft ranks data:");
  redrawRankRequests(false);
  const requests = RANKS_SHEETS.map((rank) => {
    return new Promise((resolve) => {
      httpGetFile(
        `https://docs.google.com/spreadsheets/d/${rank.sheet}/gviz/tq?sheet=${rank.page}`,
        rank.setCode + "_ranks",
        false
      )
        .then(asyncSleep<string>(10))
        .then((file) => {
          fs.readFile(file, function read(_err, data) {
            let str = data.toString();
            str = str
              .replace("/*O_o*/", "")
              .replace(`google.visualization.Query.setResponse(`, "")
              .replace(`);`, " ");

            setRankRequestState(rank.setCode, 1);
            try {
              ranksData[rank.setCode.toUpperCase()] = processRanksData(
                str,
                rank.source
              );
            } catch (e) {
              setRankRequestState(rank.setCode, -1);
            }
            resolve();
          });
        });
    });
  });

  return Promise.all(requests);
}

function processRanksData(str: string, source: number): SetRanks {
  const data = JSON.parse(str);
  const ret: SetRanks = {};
  if (source == RATINGS_MTGCSR) {
    data.table.rows.forEach((row: any) => {
      const name = row.c[0].v;
      const rank = Math.round(row.c[4].v);
      const cont = Math.round(row.c[5].v);
      const values = [
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
      ret[name] = {
        rankSource: source,
        rank: rank,
        cont: cont,
        values: values,
      };
    });
  }
  if (source == RATINGS_LOLA) {
    data.table.rows.forEach((row: any) => {
      const name = row.c[0].v;
      const rank = row.c[10].v;
      const side = row.c[5] ? true : false;
      const ceil = row.c[4] ? row.c[4].v : rank;
      const values = [row.c[1].v, row.c[2].v, row.c[3].v];
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

function getMetagameData(): Promise<void> {
  return new Promise((resolve) => {
    const req = httpGetText("https://mtgatool.com/database/metagame.php");
    console.log("Download metagame data.");
    req.addEventListener("load", function () {
      const json = JSON.parse(`{"metagame": ${req.responseText} }`);
      metagameData = json.metagame;
      resolve();
    });
  });
}

type SetName = keyof typeof SETS_DATA;

function getSetIcons() {
  const setNames = Object.keys(SETS_DATA) as SetName[];

  const requests = setNames.map((s) => {
    const set = SETS_DATA[s];
    return { name: s, code: set.scryfall, state: 0 };
  });

  const redrawSetsRequests = function (moveBack = true) {
    if (process.env.TRAVIS) return;
    process.stdout.moveCursor(0, moveBack ? -5 : 0);
    let api = 0;
    let svg = 0;
    let ok = 0;
    let err = 0;
    const errors: string[] = [];
    requests.forEach((r) => {
      if (r.state == -1) {
        err++;
        errors.push(r.code);
      }
      if (r.state == 0) api++;
      if (r.state == 1) svg++;
      if (r.state == 2) ok++;
    });
    process.stdout.write(
      `\x1b[41m\x1b[30m ${api} \t\x1b[0m Fetching Scryfall Api
\x1b[41m\x1b[30m ${svg} \t\x1b[0m Fetching Svg
\x1b[42m\x1b[30m ${ok} \t\x1b[0m OK
\x1b[45m\x1b[30m ${err} \t\x1b[0m Errors
${errors.join(" ")}
`
    );
  };

  const setSetRequestState = function (name: string, state: number) {
    requests.forEach((r, index) => {
      if (r.name == name) {
        requests[index].state = state;
      }
    });
    redrawSetsRequests();
  };

  console.log("Obtaining Sets data.");
  console.log(setNames.length + " total");
  redrawSetsRequests(false);

  return new Promise((resolve) => {
    let count = 0;
    setNames.forEach((setName) => {
      let code = SETS_DATA[setName].scryfall;
      if (setName == "" || setName == "Arena New Player Experience") {
        // hack hack hack
        // for some reason, scryfall does not provide this yet
        // manually insert here instead
        count++;
        let str = ARENA_SVG;
        str = str.replace(/fill="#.*?\"\ */g, " ");
        str = str.replace(/<path /g, '<path fill="#FFF" ');
        SETS_DATA[setName].svg = Buffer.from(str).toString("base64");
        code = "default";
        setSetRequestState(setName, 2);
      }
      if (setName == "M19 Gift Pack") code = "m19";

      const setUri = `https://api.scryfall.com/sets/${code}`;
      if (code !== "default") {
        httpGetTextAsync(setUri).then(
          (setStr) => {
            const setData = JSON.parse(setStr) as MagicSet;
            SETS_DATA[setName].release = setData.released_at || "";
            const svgUrl = setData.icon_svg_uri;
            setSetRequestState(setName, 1);
            httpGetTextAsync(svgUrl).then((str: string) => {
              if (code == "akr") str = AKR_SVG;
              str = str.replace(/fill="#.*?\"\ */g, " ");
              str = str.replace(/<path /g, '<path fill="#FFF" ');
              SETS_DATA[setName].svg = Buffer.from(str).toString("base64");
              if (setData.released_at) {
                SETS_DATA[setName].release = setData.released_at;
              }
              count++;
              setSetRequestState(setName, 2);
              if (count == setNames.length) {
                resolve();
              }
            });
          },
          () => setSetRequestState(setName, -1)
        );
      }
    });
  });
}

interface BulkDataResponse {
  object: string;
  has_more: boolean;
  data: {
    object: string;
    id: string;
    type: string;
    updated_at: string;
    uri: string;
    name: string;
    description: string;
    compressed_size: number;
    download_uri: string;
    content_type: string;
    content_encoding: string;
  }[];
}

function getScryfallCards() {
  return new Promise((resolve) => {
    const file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);
    if (!fs.existsSync(file)) {
      httpGetTextAsync("https://api.scryfall.com/bulk-data").then((str) => {
        const bulkData: BulkDataResponse = JSON.parse(str);
        let downloadURL = undefined;
        bulkData.data.forEach((data) => {
          if (data.type == "all_cards") {
            downloadURL = data.download_uri;
          }
        });
        if (downloadURL) {
          console.log("Downloading Scryfall cards data.");
          httpGetFile(downloadURL, SCRYFALL_FILE).then((_file) => {
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

function generateScryfallDatabase(): Promise<ScryfallData> {
  return new Promise((resolve) => {
    console.log("Processing Scryfall database.");
    const file = path.join(APPDATA, EXTERNAL, SCRYFALL_FILE);

    fs.stat(file, function (
      _err: NodeJS.ErrnoException | null,
      _stats: fs.Stats
    ) {
      //const fileSize = stats.size;
      let _readSize = 0;
      const stream = fs.createReadStream(file, {
        flags: "r",
        encoding: "utf-8",
      });
      let buf = "";

      // We read the file as a stream, decoding line by line because decoding
      // such a huge file in JS causes the GC to go craz yand crash for me.
      // The only problem may be if Scryfall changes its files and stops
      // using the newline characters..

      const scryfallData: ScryfallData = {};
      const scryfallDataAdd = function (
        obj: CardApiResponse,
        lang: string,
        set: string,
        name: string,
        cid: false | string = false
      ) {
        if (scryfallData[lang] == undefined) {
          scryfallData[lang] = {};
        }
        if (scryfallData[lang][set] == undefined) {
          scryfallData[lang][set] = {};
        }
        if (
          scryfallData[lang][set][name] == undefined &&
          !CID_ART_SETS.includes(set)
        ) {
          scryfallData[lang][set][name] = {};
        }

        const artist = obj.artist?.toLowerCase();
        if (artist) {
          if (scryfallData[lang]["byArt"] == undefined) {
            scryfallData[lang]["byArt"] = {};
          }
          if (scryfallData[lang]["byArt"][name] == undefined) {
            scryfallData[lang]["byArt"][name] = {};
          }
          if (scryfallData[lang]["byArt"][name][artist] == undefined) {
            scryfallData[lang]["byArt"][name][artist] = obj;
          }
        }

        if (CID_ART_SETS.includes(set) && cid) {
          scryfallData[lang][set][cid] = obj;
        } else if (NO_DUPES_ART_SETS.includes(set)) {
          scryfallData[lang][set][name] = obj;
        } else if (cid) {
          scryfallData[lang][set][name][cid] = obj;
        }
      };

      const pump = function () {
        let pos;

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

      const processLine = function (line: string): void {
        // here's where we do something with a line
        if (line[line.length - 1] == "\r")
          line = line.substr(0, line.length - 1); // discard CR (0x0D)

        line = line.slice(0, -1);

        if (line.length > 0) {
          try {
            const obj: CardApiResponse = JSON.parse(line);
            /*
            if (obj.set == "eld" && obj.collector_number == 149) {
              console.log(line);
            }
            */
            if (ALLOWED_SCRYFALL.includes(obj.set)) {
              const lineLang = obj.lang.toUpperCase();
              const name = obj.name;
              scryfallDataAdd(
                obj,
                lineLang,
                obj.set,
                name,
                obj.collector_number
              );
              const l: string = obj.layout; // Not znr types yet! (modal_dfc)
              if (
                (l == "adventure" ||
                  l == "modal_dfc" ||
                  l == "transform" ||
                  l == "split") &&
                obj.card_faces
              ) {
                obj.card_faces.forEach((face) => {
                  const name = face.name;
                  const newObj = Object.assign(_.cloneDeep(obj), face);
                  scryfallDataAdd(
                    newObj,
                    lineLang,
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
        const dataLength = d.length;
        _readSize += dataLength;
        buf += d.toString(); // when data is read, stash it in a string buffer
        pump(); // then process the buffer
      });

      stream.on("end", function () {
        resolve(scryfallData);
      });
    });
  });
}

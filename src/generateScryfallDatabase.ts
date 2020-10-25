import {
  ALLOWED_SCRYFALL,
  APPDATA,
  CID_ART_SETS,
  EXTERNAL,
  NO_DUPES_ART_SETS,
  SCRYFALL_FILE,
} from "./metadata-constants";
import path from "path";
import fs from "fs";
import _ from "lodash";
import { ScryfallData } from "./types/scryfall";
import CardApiResponse from "scryfall-client/dist/types/api/card";

export default function generateScryfallDatabase(): Promise<ScryfallData> {
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

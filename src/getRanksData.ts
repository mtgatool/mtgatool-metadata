import fs from "fs";
import _ from "lodash";
import asyncSleep from "./asyncSleep";
import { RANKS_SHEETS } from "./metadata-constants";
import processRanksData from "./processRanksData";
import { ranksData } from "./utils/globals";
import httpGetFileWIthProgres from "./utils/httpGetFileWIthProgres";

export default function getRanksData(): Promise<void[]> {
  const rankRequests = RANKS_SHEETS.map((r) => {
    return { code: r.setCode, state: 0 };
  });

  const redrawRankRequests = function (moveBack = true) {
    if (process.env.GITHUB_ACTIONS) return;
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
  const requests: Promise<void>[] = RANKS_SHEETS.map((rank) => {
    return new Promise((resolve) => {
      httpGetFileWIthProgres(
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
              console.log(e);
              setRankRequestState(rank.setCode, -1);
            }
            resolve();
          });
        });
    });
  });

  return Promise.all(requests);
}

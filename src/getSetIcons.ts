import MagicSet from "scryfall-client/dist/models/magic-set";
import { AKR_SVG, ARENA_SVG, SETS_DATA } from "./metadata-constants";
import httpGetTextAsync from "./utils/httpGetTextAsync";

type SetName = keyof typeof SETS_DATA;

export default function getSetIcons(): Promise<void> {
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

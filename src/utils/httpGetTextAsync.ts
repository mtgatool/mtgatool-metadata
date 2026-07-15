import { XMLHttpRequest } from "xmlhttprequest-ts";

export default function httpGetTextAsync(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url);
    // Scryfall now REQUIRES a descriptive User-Agent and an Accept header and
    // rejects (403) requests without them — this is why set icons stopped
    // resolving. (See https://scryfall.com/docs/api.)
    try {
      xmlHttp.setRequestHeader(
        "User-Agent",
        "mtgatool-metadata/1.0 (+https://github.com/mtgatool/mtgatool-metadata)"
      );
      xmlHttp.setRequestHeader("Accept", "*/*");
    } catch (e) {
      // some environments disallow setting these headers; ignore
    }
    xmlHttp.send();

    xmlHttp.onreadystatechange = () => {
      if (xmlHttp.status === 404) {
        reject();
      }
    };

    xmlHttp.addEventListener("load", function () {
      resolve(xmlHttp.responseText);
    });

    xmlHttp.addEventListener("error", function () {
      reject();
    });

    xmlHttp.addEventListener("abort", function () {
      reject();
    });
  });
}

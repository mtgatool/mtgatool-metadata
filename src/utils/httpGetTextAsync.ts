import { XMLHttpRequest } from "xmlhttprequest-ts";

export default function httpGetTextAsync(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url);
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

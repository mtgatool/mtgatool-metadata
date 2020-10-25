import { XMLHttpRequest } from "xmlhttprequest-ts";

export default function httpGetText(url: string): XMLHttpRequest {
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url);
  xmlHttp.send();
  return xmlHttp;
}

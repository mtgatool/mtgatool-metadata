import path from "path";
import fs from "fs";
// import stripComments from "strip-json-comments";
import { APPDATA, EXTERNAL } from "./metadata-constants";

export default function readExternalJson(filename: string): any {
  const file = path.join(APPDATA, EXTERNAL, filename);
  //JSON.parse(fs.readFileSync(file));
  const filestr = fs.readFileSync(file) + "";
  // const str = stripComments(filestr);
  try {
    const json = JSON.parse(`{"value": ${filestr}}`);
    return json.value;
  } catch (e) {
    console.log(filename);
    console.log(filestr);
  }
  return "";
}

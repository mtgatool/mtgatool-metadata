import httpGetText from "./utils/httpGetText";

export default function getMetagameData(): Promise<any> {
  return new Promise((resolve) => {
    const req = httpGetText("https://mtgatool.com/database/metagame.php");
    console.log("Download metagame data.");
    req.addEventListener("load", function () {
      const json = JSON.parse(`{"metagame": ${req.responseText} }`);

      resolve(json.metagame);
    });
  });
}

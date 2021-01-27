import { getArenaVersion, getManifestFiles } from "./manifest-parser";

getArenaVersion("VIP")
  .then((version) => getManifestFiles(version))
  .then(() => {
    process.exit();
  });

import { getArenaVersion, getManifestFiles } from "./manifest-parser";

getArenaVersion()
  .then((version) => getManifestFiles(version))
  .then(() => {
    process.exit();
  });

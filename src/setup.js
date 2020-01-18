const manifestParser = require("./manifest-parser");

manifestParser
  .getArenaVersion()
  .then(version => manifestParser.getManifestFiles(version))
  .then(() => {
    process.exit();
  });

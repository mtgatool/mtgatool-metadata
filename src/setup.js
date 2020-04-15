const manifestParser = require("./manifest-parser");

manifestParser
  .getArenaVersion("VIP")
  .then(version => manifestParser.getManifestFiles(version))
  .then(() => {
    process.exit();
  });

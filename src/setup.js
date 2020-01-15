const manifestParser = require("./manifest-parser");

manifestParser
  .getManifestFiles("0.1.2082.755177")
  //.getArenaVersion()
  //.then(version => manifestParser.getManifestFiles(version))
  .then(() => {
    process.exit();
  });

/**
 * Build a SQLite card database from an already-generated `*-database.json`.
 *
 * The full pipeline downloads Arena's manifest and the Scryfall bulk data,
 * which takes a long time and is unnecessary when all you want is to iterate on
 * the SQLite schema or hand a build to mtgatool-desktop for testing. Point this
 * at any metadata JSON — including the one bundled at
 * `mtgatool-desktop/src/assets/resources/database.json` — and it produces the
 * same file `generateMetadata` would.
 *
 *   npm run sqlite -- <path/to/database.json> [out.sqlite]
 */
import fs from "fs";
import path from "path";

import writeSqliteDatabase from "./writeSqlite";

function main(): void {
  const [, , inputArg, outputArg] = process.argv;

  if (!inputArg) {
    console.error(
      "Usage: npm run sqlite -- <path/to/database.json> [out.sqlite]"
    );
    process.exit(1);
    return;
  }

  const inputPath = path.resolve(inputArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`No such file: ${inputPath}`);
    process.exit(1);
    return;
  }

  console.log(`Reading ${inputPath} …`);
  const readStarted = Date.now();
  const metadata = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  console.log(`Parsed in ${((Date.now() - readStarted) / 1000).toFixed(1)}s`);

  const outPath = outputArg
    ? path.resolve(outputArg)
    : inputPath.replace(/\.json$/, "") + ".sqlite";

  const started = Date.now();
  const stats = writeSqliteDatabase(
    {
      cards: metadata.cards,
      sets: metadata.sets,
      setNames: metadata.setNames,
      digitalSets: metadata.digitalSets || [],
      abilities: metadata.abilities || {},
      artSets: metadata.artSets || {},
      version: String(metadata.version),
      language: metadata.language || "EN",
      updated: metadata.updated || Date.now(),
    },
    outPath
  );

  const sourceBytes = fs.statSync(inputPath).size;
  console.log(
    `\n${outPath}\n` +
      `  built in     ${((Date.now() - started) / 1000).toFixed(1)}s\n` +
      `  cards        ${stats.cards}\n` +
      `  sets         ${stats.sets}\n` +
      `  abilities    ${stats.abilities}\n` +
      `  formats      ${stats.formats}\n` +
      `  legal pairs  ${stats.legalPairs}\n` +
      `  size         ${(stats.bytes / 1048576).toFixed(1)} MB ` +
      `(json was ${(sourceBytes / 1048576).toFixed(1)} MB)`
  );
}

main();

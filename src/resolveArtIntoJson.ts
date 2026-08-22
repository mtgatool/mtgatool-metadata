/**
 * Add resolved card art to an already-generated `*-database.json`.
 *
 * The full pipeline downloads Arena's manifest before it gets anywhere near
 * art, which is a long wait when art is the only thing you are changing. This
 * takes any metadata JSON — including the one bundled at
 * `mtgatool-desktop/src/assets/resources/database.json` — resolves art against
 * the Scryfall bulk snapshot, and writes it back out with `Art` on every card
 * it could place and `artSets` alongside `sets`.
 *
 *   npm run art -- <path/to/database.json> [out.json]
 *
 * Names must be English for this to work, which the `-en-` databases are. A
 * localized one resolves almost nothing and will say so.
 */
import fs from "fs";
import path from "path";

import resolveCardArt, { ArtCardInput } from "./resolveCardArt";
import { resolveSetName } from "./setCardData";
import downloadScryfallBulk, { readScryfallBulk } from "./scryfallBulk";

async function main(): Promise<void> {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg) {
    console.error("Usage: npm run art -- <path/to/database.json> [out.json]");
    process.exit(1);
    return;
  }

  const inputPath = path.resolve(inputArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`No such file: ${inputPath}`);
    process.exit(1);
    return;
  }

  const file = await downloadScryfallBulk();
  if (!file) {
    console.error("Could not obtain Scryfall bulk data.");
    process.exit(1);
    return;
  }
  const bulk = await readScryfallBulk(file);
  console.log(`Read ${bulk.prints.length} Scryfall prints.`);

  console.log(`Reading ${inputPath} …`);
  const metadata = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (metadata.language && metadata.language !== "EN") {
    console.log(
      `Warning: this database is ${metadata.language}. Art resolution matches` +
        ` on English card names and will place very few cards.`
    );
  }

  const inputs: ArtCardInput[] = [];
  Object.keys(metadata.cards).forEach((key) => {
    const card = metadata.cards[key];
    if (!card) return;
    inputs.push({
      GrpId: card.GrpId,
      Name: card.Name,
      Set: card.Set || "",
      DigitalSet: card.DigitalSet || "",
      CollectorNumber: card.CollectorNumber,
      ArtistCredit: card.ArtistCredit,
      IsToken: !!card.IsToken,
    });
  });

  const toScryfall = (code: string): string | null => {
    const name = resolveSetName(code, metadata.setNames);
    const set = name ? metadata.sets[name] : undefined;
    return set && set.scryfall ? String(set.scryfall).toLowerCase() : null;
  };

  const started = Date.now();
  const resolved = resolveCardArt(inputs, toScryfall, bulk);
  const st = resolved.stats;

  Object.keys(metadata.cards).forEach((key) => {
    const card = metadata.cards[key];
    if (!card) return;
    const art = resolved.art[card.GrpId];
    if (art) card.Art = art;
    else delete card.Art;
  });
  metadata.artSets = resolved.artSets;

  const outPath = outputArg ? path.resolve(outputArg) : inputPath;
  fs.writeFileSync(outPath, JSON.stringify(metadata));

  const placed =
    st.exact +
    st.byArenaId +
    st.corrected +
    st.substituteByArtist +
    st.substituteAny;
  console.log(
    `\n${outPath}\n` +
      `  resolved in           ${((Date.now() - started) / 1000).toFixed(
        1
      )}s\n` +
      `  exact (set + number)  ${st.exact}\n` +
      `  exact (arena_id)      ${st.byArenaId}\n` +
      `  corrected in set      ${st.corrected}\n` +
      `  substitute, artist    ${st.substituteByArtist}\n` +
      `  substitute, any art   ${st.substituteAny}\n` +
      `  not on Scryfall       ${st.unresolved}\n` +
      `  placed                ${placed}\n` +
      `  art sets referenced   ${Object.keys(resolved.artSets).length}\n` +
      `  size                  ${(fs.statSync(outPath).size / 1048576).toFixed(
        1
      )} MB`
  );
}

main();

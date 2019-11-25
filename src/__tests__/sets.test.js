/* eslint-env jest */

const manifestParser = require("../manifest-parser");
const path = require("path");
const fs = require("fs");

const {
  MANIFEST_VERSION,
  APPDATA,
  EXTERNAL,
  SET_NAMES
} = require("../metadata-constants");

beforeAll(() => {
  return manifestParser.getManifestFiles(MANIFEST_VERSION);
});

let sets = getSets();

describe("Check sets data", () => {
  test.each(sets)(
    "Set %p (%p cards)",
    (setCode) => {
      expect(SET_NAMES[setCode]).toBeDefined();
    }
  );
});

function getSets() {
  let file = path.join(APPDATA, EXTERNAL, "cards.json");
  let cards = JSON.parse(`{"value": ${fs.readFileSync(file)}}`);
  
  let sets = [];
  let setCards = {};
  // get all sets in cards.json
  cards.value.forEach(card => {
    if (!setCards[card.set]) setCards[card.set] = 1;
    else setCards[card.set] += 1;
    // We ignore ArenaSUP
    if (!sets.includes(card.set) && card.set !== "ArenaSUP") {
      sets.push(card.set);
    }
  });
  // Build return array
  // [[set, cards], [set, cards], [set, cards]]
  let ret = [];
  sets.forEach(code => {
    ret.push([code, setCards[code]])
  });
  return ret;
}
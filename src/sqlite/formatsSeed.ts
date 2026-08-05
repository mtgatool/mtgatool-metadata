import fs from "fs";
import path from "path";

import { APPDATA } from "../metadata-constants";

/**
 * The GetFormats snapshot used to seed the shipped database.
 *
 * Formats are the one piece of metadata Arena does not publish: there is no
 * Formats table in its CardDatabase and no formats asset in the manifest. The
 * only source is the `GetFormats` response the client logs on every launch, so
 * this file is a snapshot captured from a real log (mtgatool-desktop carries
 * `scripts/update-formats.js`, which is what produces it).
 *
 * Refresh it by copying mtgatool-desktop's `src/assets/resources/formats.json`
 * over `formats.json` in this repo's root after re-running that script.
 */
export interface SeedFormatRaw {
  name: string;
  legalSets?: string[];
  filterSets?: string[];
  bannedTitleIds?: number[];
  suspendedTitleIds?: number[];
  allowedTitleIds?: number[];
  supressedTitleIds?: number[];
  AllowedCommanderTitleIds?: number[];
  individualCardQuotas?: Record<string, { max: number }>;
  FormatType?: string;
  cardCountRestriction?: string;
  sideboardBehavior?: string;
  useRebalancedCards?: boolean;
  mainDeckQuota?: { min?: number; max?: number };
  sideBoardQuota?: { min?: number; max?: number };
  commandZoneQuota?: { min?: number; max?: number };
}

export interface SeedFormatGroup {
  GroupName: string;
  FormatNames: string[];
}

export interface FormatsSeed {
  Formats: SeedFormatRaw[];
  FormatGroups: SeedFormatGroup[];
}

export const FORMATS_SEED_PATH = path.join(APPDATA, "formats.json");

export default function readFormatsSeed(): FormatsSeed {
  if (!fs.existsSync(FORMATS_SEED_PATH)) {
    throw new Error(
      `Formats snapshot missing at ${FORMATS_SEED_PATH}. Copy it from ` +
        `mtgatool-desktop/src/assets/resources/formats.json.`
    );
  }

  const parsed = JSON.parse(
    fs.readFileSync(FORMATS_SEED_PATH, "utf8")
  ) as FormatsSeed;

  if (!parsed.Formats || parsed.Formats.length === 0) {
    throw new Error(`Formats snapshot at ${FORMATS_SEED_PATH} has no formats.`);
  }

  return {
    Formats: parsed.Formats,
    FormatGroups: parsed.FormatGroups || [],
  };
}

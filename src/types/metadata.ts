import { constants } from "mtgatool-shared";
const { RATINGS_LOLA, RATINGS_MTGCSR } = constants;

interface RankDataLola {
  rankSource: typeof RATINGS_LOLA;
  rank: number;
  side: boolean;
  ceil: number;
  values: number[];
}

interface RankDataMTGCSR {
  rankSource: typeof RATINGS_MTGCSR;
  rank: number;
  cont: number;
  values: number[];
}

interface RankDataNone {
  rankSource: -1;
}

type RankData = RankDataLola | RankDataMTGCSR | RankDataNone;

export type SetRanks = Record<string, RankData>;

export type RanksData = Record<string, SetRanks>;

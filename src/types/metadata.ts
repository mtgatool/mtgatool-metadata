import {
  RATINGS_MTGCSR,
  RATINGS_LOLA,
  RATINGS_LOLA_B,
} from "../metadata-constants";

interface RankDataLola {
  rankSource: typeof RATINGS_LOLA | typeof RATINGS_LOLA_B;
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

export interface BulkDataResponse {
  object: string;
  has_more: boolean;
  data: {
    object: string;
    id: string;
    type: string;
    updated_at: string;
    uri: string;
    name: string;
    description: string;
    compressed_size: number;
    download_uri: string;
    content_type: string;
    content_encoding: string;
  }[];
}

import { Rarity } from "mtgatool-shared";
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

export type RankData = RankDataLola | RankDataMTGCSR | RankDataNone;

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

export interface DbCardDataV2 {
  GrpId: number;
  TitleId: number;
  Name: string;
  AltName: string;
  FlavorText: string;
  ArtistCredit: string;
  Rarity: Rarity;
  Set: string;
  DigitalSet: string | null;
  IsToken: boolean;
  IsPrimaryCard: boolean;
  IsDigitalOnly: boolean;
  IsRebalanced: boolean;
  RebalancedCardGrpId: number;
  DefunctRebalancedCardGrpId: number;
  CollectorNumber: string;
  CollectorMax: string;
  UsesSideboard: number;
  ManaCost: string[];
  Cmc: number;
  LinkedFaceType: number;
  RawFrameDetail: string;
  Power: number | null;
  Toughness: number | null;
  Colors: number[];
  ColorIdentity: number[];
  FrameColors: number[];
  Types: string;
  Subtypes: string;
  Supertypes: string;
  AbilityIds: number[];
  HiddenAbilityIds: number[];
  LinkedFaceGrpIds: number[];
  AbilityIdToLinkedTokenGrpId: Record<string, string>;
  AbilityIdToLinkedConjurations: Record<string, string>;
  AdditionalFrameDetails: string[];
  RankData: RankData;
  Reprints: number[];
}

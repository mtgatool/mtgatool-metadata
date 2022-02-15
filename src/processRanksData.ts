import {
  RATINGS_LOLA,
  RATINGS_LOLA_B,
  RATINGS_MTGCSR,
} from "./metadata-constants";
import { SetRanks } from "./types/metadata";

export default function processRanksData(
  str: string,
  source: number
): SetRanks {
  const data = JSON.parse(str);
  const ret: SetRanks = {};
  if (source == RATINGS_MTGCSR) {
    data.table.rows.forEach((row: any) => {
      const name = row.c[0].v;
      const rank = Math.round(row.c[4].v);
      const cont = Math.round(row.c[5].v);
      const values = [
        row.c[9].v,
        row.c[10].v,
        row.c[11].v,
        row.c[12].v,
        row.c[13].v,
        row.c[14].v,
        row.c[15].v,
        row.c[16].v,
        row.c[17].v,
        row.c[18].v,
        row.c[19].v,
        row.c[20].v,
        row.c[21].v,
      ];
      ret[name] = {
        rankSource: source,
        rank: rank,
        cont: cont,
        values: values,
      };
    });
  }
  if (source == RATINGS_LOLA) {
    data.table.rows.forEach((row: any) => {
      if (row.c[10]) {
        const name = row.c[0].v;
        const rank = row.c[10].v || 0;
        const side = row.c[5] ? true : false;
        const ceil = row.c[4] ? row.c[4].v : rank;
        const values = [row.c[1].v, row.c[2].v, row.c[3].v];
        ret[name] = {
          rankSource: source,
          rank: Math.round(rank),
          side: side,
          ceil: Math.round(ceil),
          values: values,
        };
      } else {
        // console.log(row);
      }
    });
  }
  if (source == RATINGS_LOLA_B) {
    // JustLolaMan and ScottyNada only
    data.table.rows.forEach((row: any) => {
      if (row.c[10]) {
        const name = row.c[0].v;
        const rank = row.c[9].v || 0;
        const side = row.c[4] ? true : false;
        const ceil = row.c[3] ? row.c[3].v : rank;
        const values = [row.c[1].v, 0, row.c[2].v];
        ret[name] = {
          rankSource: source,
          rank: Math.round(rank),
          side: side,
          ceil: Math.round(ceil),
          values: values,
        };
      } else {
        // console.log(row);
      }
    });
  }

  return ret;
}

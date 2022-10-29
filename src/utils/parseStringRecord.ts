export default function parseStringRecord(
  str: string | undefined | null
): Record<string, string> {
  if (!str) return {};

  const arr = str.split(",");

  if (arr.length === 1 && arr[0] === "") return {};

  const ret: Record<string, string> = {};

  arr.forEach((item) => {
    const splitItem: string[] = item.split(":");
    ret[splitItem[0]] = splitItem[1] || splitItem[0];
  });

  return ret;
}

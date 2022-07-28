export default function parseStringRecord(
  str: string | undefined
): Record<string, string> {
  const arr = (str || "").split(",");

  const ret: Record<string, string> = {};

  arr.forEach((item) => {
    const splitItem: string[] = item.split(":");
    ret[splitItem[0]] = splitItem[1];
  });

  return ret;
}

export default function parseStringArray(str: string | undefined): string[] {
  return (str || "").split(",");
}

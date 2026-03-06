export function numberToWords(num: number): string {
  if (num === 0) return "Zero Naira Only";

  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const n = String(num).padStart(12, "0"); // pad to 12 digits (billions)

  if (Number(n) > 999999999999) return "Amount too large";

  const convertChunk = (chunk: string): string => {
    let str = "";
    const h = parseInt(chunk[0], 10);
    const t = parseInt(chunk[1], 10);
    const u = parseInt(chunk[2], 10);

    if (h > 0) {
      str += a[h] + "Hundred ";
      if (t > 0 || u > 0) str += "and ";
    }

    if (t === 1) {
      str += a[t * 10 + u];
    } else if (t > 1) {
      str += b[t] + (u > 0 ? "-" + a[u] : " ");
    } else if (u > 0) {
      str += a[u];
    }

    return str;
  };

  let word = "";

  const billions = convertChunk(n.substring(0, 3));
  if (billions) word += billions + "Billion, ";

  const millions = convertChunk(n.substring(3, 6));
  if (millions) word += millions + "Million, ";

  const thousands = convertChunk(n.substring(6, 9));
  if (thousands) word += thousands + "Thousand, ";

  const unitsStr = n.substring(9, 12);
  const units = convertChunk(unitsStr);

  // Clean up 'and' spacing if thousands or millions were there beforehand
  if (
    (billions || millions || thousands) &&
    units &&
    !unitsStr.startsWith("0")
  ) {
    // Already has an 'and' inside units if it had hundreds, but if it didn't have hundreds we might need one
    if (parseInt(unitsStr[0], 10) === 0) {
      word += "and ";
    }
  }

  if (units) word += units;

  word = word.replace(/,\s*$/, "").trim(); // Remove trailing commas

  return word ? word + " Naira Only" : "Zero Naira Only";
}

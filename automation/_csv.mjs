// Minimal CSV parser (handles quoted fields + escaped quotes). Shared by automation scripts.
export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length === 0) return [];
  const header = splitRow(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitRow(line);
    const o = {};
    header.forEach((h, i) => (o[h] = cells[i] ?? ""));
    return o;
  });
}

function splitRow(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else if (c === '"') {
      q = true;
    } else cur += c;
  }
  out.push(cur);
  return out;
}

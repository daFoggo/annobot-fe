// Scans source files for mojibake (corrupted UTF-8 from shell/batch edits).
// Exits non-zero if any are found, listing file:line for each hit.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative, basename } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts"];
const SKIP_DIRS = ["node_modules", ".output", ".tanstack", ".vinxi", "dist"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".mjs", ".cjs"]);

// Corrupted-UTF-8 byte sequences (decoded as Latin-1) for common mojibake.
// Built from codepoints so the script never matches its own source.
//  - â€[x]  : UTF-8 em-dash/ellipsis/quote bytes (… — ' ") decoded as Latin-1
//  - Ã+high : any UTF-8 char decoded as Latin-1 (Ã© = é, Ã£ = ã, ...)
//  - Â+high : double-encoded chars (Â· = ·, Â¡ = ¡, ...)
const P = (c) => String.fromCharCode(c);
const HIGH = Array.from({ length: 0xbf - 0x80 + 1 }, (_, i) => P(0x80 + i)).join("");
const MOJIBAKE = new RegExp(
  [
    `${P(0x00e2)}${P(0x20ac)}[^x]`, // â€¦ â€” â€™ â€œ ...
    `${P(0x00c3)}[${HIGH}]`, // Ã + high-Latin byte (mojibake of any UTF-8 char)
    `${P(0x00c2)}[${HIGH}]`, // Â + high-Latin byte (double-encoded Latin-1 char)
  ].join("|"),
  "g",
);

const SELF = new URL(import.meta.url).pathname.split(/[\\/]/).pop();

const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.includes(name)) out.push(...walk(p));
    } else if (EXTENSIONS.has(extname(p))) {
      out.push(p);
    }
  }
  return out;
}

let issues = 0;

for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir);
  if (!statSync(abs).isDirectory()) continue;
  for (const file of walk(abs)) {
    if (basename(file) === SELF) continue;
    const text = readFileSync(file, "utf8");
    if (!MOJIBAKE.test(text)) continue;
    MOJIBAKE.lastIndex = 0;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      MOJIBAKE.lastIndex = 0;
      const match = lines[i].match(MOJIBAKE);
      if (match) {
        console.error(`mojibake ${relative(ROOT, file)}:${i + 1} ${JSON.stringify(match[0])}`);
        issues++;
      }
    }
  }
}

if (issues > 0) {
  console.error(`\nFound ${issues} mojibake issue(s). Fix with the edit tool, not shell writes.`);
  process.exit(1);
}
console.log("No mojibake found.");
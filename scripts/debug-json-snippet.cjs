/*
  Debug helper: print a snippet around a given string index in a file.
  Usage:
    node scripts/debug-json-snippet.cjs <file> <pos>
*/

const fs = require('fs');

const filePath = process.argv[2];
const pos = Number(process.argv[3]);

if (!filePath || !Number.isFinite(pos)) {
  process.stderr.write('Usage: node scripts/debug-json-snippet.cjs <file> <pos>\n');
  process.exit(2);
}

const raw = fs.readFileSync(filePath);
const text = raw.toString('utf8');

const start = Math.max(0, pos - 200);
const end = Math.min(text.length, pos + 200);
const snippet = text.slice(start, end);

const tail = text.slice(Math.max(0, text.length - 200));

process.stdout.write(
  JSON.stringify(
    {
      filePath,
      byteLength: raw.length,
      textLength: text.length,
      pos,
      snippetRange: [start, end],
      snippetJson: snippet,
      tailJson: tail,
      lastCharCodes: Array.from(text.slice(-20)).map((c) => c.charCodeAt(0)),
    },
    null,
    2
  ) + '\n'
);

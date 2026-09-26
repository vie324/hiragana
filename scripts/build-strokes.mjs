// KanjiVG (https://kanjivg.tagaini.net) から ひらがなの 書き順データを取得して
// src/data/strokes.json を生成するスクリプト。
//   node scripts/build-strokes.mjs
// 生成物は KanjiVG と同じ CC BY-SA 3.0 ライセンスです。
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, 'node_modules', '.cache', 'kanjivg');
const out = join(root, 'src', 'data', 'strokes.json');
const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/';

// ぁ(3041) 〜 ゖ(3096)
const codes = [];
for (let c = 0x3041; c <= 0x3096; c++) codes.push(c);

async function fetchSvg(code) {
  const name = code.toString(16).padStart(5, '0') + '.svg';
  const cached = join(cacheDir, name);
  if (existsSync(cached)) return readFile(cached, 'utf8');
  const res = await fetch(BASE + name);
  if (!res.ok) return null;
  const text = await res.text();
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cached, text);
  return text;
}

const result = {};
for (const code of codes) {
  const ch = String.fromCodePoint(code);
  const svg = await fetchSvg(code);
  if (!svg) {
    console.warn('missing', ch);
    continue;
  }
  const strokes = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s(\d+)"[^>]*\sd="([^"]+)"/g)]
    .map((m) => ({ n: Number(m[1]), d: m[2].replace(/\s+/g, ' ').trim() }))
    .sort((a, b) => a.n - b.n)
    .map((s) => s.d);
  const numbers = [...svg.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.-]+) ([\d.-]+)\)">(\d+)<\/text>/g)]
    .sort((a, b) => Number(a[3]) - Number(b[3]))
    .map((m) => [Number(m[1]), Number(m[2])]);
  if (!strokes.length) {
    console.warn('no strokes', ch);
    continue;
  }
  result[ch] = { s: strokes, n: numbers };
}

await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(result, null, 0).replace(/\],"/g, '],\n"') + '\n');
console.log('wrote', Object.keys(result).length, 'characters to', out);

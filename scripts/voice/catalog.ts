/**
 * よみあげる ぶんの いちらんを つくる: npm run voice:catalog
 * → scripts/voice/phrases.json (scripts/voice/generate.py が よむ)
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../src/voice/catalog';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
/** おうちの方むけの 画面は よみあげないので のぞく */
const SKIP = [/\.test\./, /ParentScreen\.tsx$/, /SetupScreen\.tsx$/, /ParentGate\.tsx$/, /screens\/parent\//];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** ソースに ちょくせつ かいてある 日本語の もじれつ ('...' "..." と、\${} の ない `...`) */
function staticTexts(): string[] {
  const files = ['src/screens', 'src/components']
    .flatMap((d) => walk(join(ROOT, d)))
    .filter((f) => /\.tsx?$/.test(f) && !SKIP.some((re) => re.test(f)));
  const out = new Set<string>();
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\\n$]|\\.)*)`/g;
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(re)) {
      const s = m[1] ?? m[2] ?? m[3] ?? '';
      if (!/[\u3040-\u30ff]/.test(s) || s.length > 80 || s.includes('${')) continue;
      // `...` は コードの きれはしを ひろわないように、ふつうの ぶんだけ
      if (m[3] !== undefined && /[{}<>();=]/.test(s)) continue;
      out.add(s);
    }
  }
  return [...out];
}

const entries = buildCatalog(staticTexts());
const counts = entries.reduce<Record<string, number>>((a, e) => ((a[e.pack] = (a[e.pack] ?? 0) + 1), a), {});
writeFileSync(join(ROOT, 'scripts/voice/phrases.json'), JSON.stringify(entries, null, 0).replace(/},{/g, '},\n{') + '\n');
console.log(`${entries.length} phrases`, counts, '→', relative(process.cwd(), join(ROOT, 'scripts/voice/phrases.json')));

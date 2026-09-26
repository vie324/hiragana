/**
 * もじの き: おぼえた もじが みに なる き。
 * 清音 46こ = み、濁音・半濁音 25こ = はな。おぼえるほど きが おおきく なる。
 */
import { memo, type CSSProperties } from 'react';
import { DAKUON, HANDAKUON, K_DAKUON, K_HANDAKUON, K_SEION, SEION, type Script } from '../lib/kana';
import { mulberry32, shuffle } from '../lib/random';
import './tree.css';

const W = 400;
const H = 440;
const GROUND_Y = 415;

/** はっぱの まるい かたまり [cx, cy, r] */
const CANOPY: [number, number, number][] = [
  [200, 150, 105],
  [115, 185, 78],
  [285, 185, 78],
  [145, 105, 70],
  [255, 105, 70],
  [200, 225, 80],
];

const inCanopy = (x: number, y: number, margin: number) => CANOPY.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r - margin);

/** みの ばしょ (ろっかくの あみめ + すこし ゆらす) */
function fruitSlots(): { x: number; y: number }[] {
  const sp = 34;
  const rowH = (sp * Math.sqrt(3)) / 2;
  const pts: { x: number; y: number }[] = [];
  const rng = mulberry32(7);
  for (let j = 0, y = 20; y < 320; j++, y += rowH) {
    for (let x = 20 + (j % 2 ? sp / 2 : 0); x < 390; x += sp) {
      if (inCanopy(x, y, 18)) pts.push({ x: x + (rng() - 0.5) * 5, y: y + (rng() - 0.5) * 5 });
    }
  }
  return pts;
}

/** はなの ばしょ (はっぱの ふちに そって) */
function flowerSlots(n: number): { x: number; y: number }[] {
  const cx = 200;
  const cy = 170;
  return Array.from({ length: n }, (_, i) => {
    const a = ((200 - (220 * i) / (n - 1)) * Math.PI) / 180;
    let r = 0;
    while (r < 260 && inCanopy(cx + Math.cos(a) * (r + 2), cy - Math.sin(a) * (r + 2), 0)) r += 2;
    r -= 8;
    return { x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r };
  });
}

const FRUITS = fruitSlots();
const FLOWERS = flowerSlots(25);

/** もじ → ばしょ (まいかい おなじ ばしょ) */
function layout(script: Script) {
  const seion = script === 'kata' ? K_SEION : SEION;
  const flowers = script === 'kata' ? [...K_DAKUON, ...K_HANDAKUON] : [...DAKUON, ...HANDAKUON];
  const order = shuffle(
    seion.map((_, i) => i),
    mulberry32(script === 'kata' ? 11 : 5),
  );
  return {
    fruits: seion.map((kana, i) => ({ kana, ...FRUITS[order[i] % FRUITS.length] })),
    flowers: flowers.map((kana, i) => ({ kana, ...FLOWERS[i] })),
  };
}

const LAYOUT: Record<Script, ReturnType<typeof layout>> = { hira: layout('hira'), kata: layout('kata') };

export const TREE_TOTAL = { fruits: 46, flowers: 25 };

/** おぼえた 清音の かずで きの おおきさが かわる (0 = め) */
export function treeStage(n: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0;
  if (n <= 5) return 1;
  if (n <= 15) return 2;
  if (n <= 30) return 3;
  return 4;
}

const STAGE_SCALE = [0.5, 0.72, 0.84, 0.93, 1];

interface Props {
  script: Script;
  /** おぼえた もじ */
  known: Set<string>;
  /** よく できる もじ (きんいろの み) */
  gold?: Set<string>;
  /** あたらしく なった み (ポンと でる) */
  fresh?: Set<string>;
  /** ちいさい ひょうじ (もじを かかない) */
  mini?: boolean;
  onTapKana?: (kana: string, known: boolean) => void;
  /** みずを あげた ときに ゆれる */
  bounce?: number;
  className?: string;
  style?: CSSProperties;
}

function LetterTree({ script, known, gold, fresh, mini, onTapKana, bounce = 0, className = '', style }: Props) {
  const { fruits, flowers } = LAYOUT[script];
  const count = fruits.filter((f) => known.has(f.kana)).length;
  const stage = treeStage(count);
  const s = STAGE_SCALE[stage];
  // ちいさい きでも みの もじが よめるように、みは すこし おおきめに
  const k = +(1 / Math.sqrt(s)).toFixed(3);
  const full = count >= fruits.length;
  const tap = (kana: string, ok: boolean) => onTapKana?.(kana, ok);
  // あたらしい みは じゅんばんに ポン ポンと でる
  let freshN = 0;
  const freshDelay = (kana: string): CSSProperties | undefined =>
    fresh?.has(kana) ? ({ '--d': `${Math.min(2.6, 0.35 + freshN++ * 0.14)}s` } as CSSProperties) : undefined;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`letter-tree tree-${script} stage-${stage} ${mini ? 'mini' : ''} ${full ? 'complete' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={`もじの き ${count}こ`}
      data-testid={mini ? 'tree-mini' : 'tree'}
      data-count={count}
    >
      <defs>
        <radialGradient id={`leaf-${script}`} cx="40%" cy="30%" r="75%">
          <stop offset="0%" className="leaf-light" />
          <stop offset="100%" className="leaf-base" />
        </radialGradient>
        <linearGradient id="trunk" x1="0" x2="1">
          <stop offset="0%" stopColor="#8a5530" />
          <stop offset="55%" stopColor="#b77a45" />
          <stop offset="100%" stopColor="#8a5530" />
        </linearGradient>
        <radialGradient id={`fruit-${script}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" className="fruit-light" />
          <stop offset="100%" className="fruit-base" />
        </radialGradient>
        <radialGradient id="fruit-gold" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff6c2" />
          <stop offset="100%" stopColor="#f5b400" />
        </radialGradient>
      </defs>

      <ellipse cx={W / 2} cy={GROUND_Y + 6} rx={150} ry={22} className="tree-ground" />

      {stage === 0 ? (
        <g className="sprout">
          <path d={`M200 ${GROUND_Y} C198 ${GROUND_Y - 30} 202 ${GROUND_Y - 50} 200 ${GROUND_Y - 70}`} className="sprout-stem" />
          <ellipse cx={180} cy={GROUND_Y - 72} rx={22} ry={11} transform={`rotate(-25 180 ${GROUND_Y - 72})`} className="sprout-leaf" />
          <ellipse cx={220} cy={GROUND_Y - 80} rx={24} ry={12} transform={`rotate(20 220 ${GROUND_Y - 80})`} className="sprout-leaf" />
        </g>
      ) : (
        <g transform={`translate(200 ${GROUND_Y}) scale(${s}) translate(-200 ${-GROUND_Y})`}>
          <g className="tree-sway" key={bounce}>
            <path d={`M170 ${GROUND_Y} C180 360 176 300 186 250 L214 250 C224 300 220 360 232 ${GROUND_Y} Z`} fill="url(#trunk)" />
            <path d="M190 268 C170 250 150 245 130 232" className="branch" />
            <path d="M212 262 C232 246 252 240 272 228" className="branch" />
            <g className="canopy-shadow">
              {CANOPY.map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy + 10} r={r} />
              ))}
            </g>
            <g fill={`url(#leaf-${script})`}>
              {CANOPY.map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} />
              ))}
            </g>
            <g className="canopy-light">
              <circle cx={150} cy={95} r={40} />
              <circle cx={235} cy={80} r={28} />
            </g>

            {flowers.map((f) =>
              known.has(f.kana) ? (
                <g
                  key={f.kana}
                  className={`blossom ${fresh?.has(f.kana) ? 'fresh' : ''}`}
                  style={freshDelay(f.kana)}
                  transform={`translate(${f.x} ${f.y}) scale(${k})`}
                  onClick={() => tap(f.kana, true)}
                  data-testid={mini ? undefined : `flower-${f.kana}`}
                >
                  <g className="blossom-in">
                    {[0, 72, 144, 216, 288].map((a) => (
                      <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 7} cy={Math.sin((a * Math.PI) / 180) * 7} r={6} className="petal" />
                    ))}
                    <circle r={4.5} className="blossom-core" />
                  </g>
                </g>
              ) : null,
            )}

            {fruits.map((f) => {
              const ok = known.has(f.kana);
              if (!ok) {
                return (
                  <g
                    key={f.kana}
                    className="bud"
                    transform={`translate(${f.x} ${f.y}) scale(${k})`}
                    onClick={() => tap(f.kana, false)}
                    data-testid={mini ? undefined : `bud-${f.kana}`}
                  >
                    <circle r={mini ? 5 : 7} />
                  </g>
                );
              }
              const isGold = gold?.has(f.kana);
              return (
                <g
                  key={f.kana}
                  className={`fruit ${isGold ? 'gold' : ''} ${fresh?.has(f.kana) ? 'fresh' : ''}`}
                  style={freshDelay(f.kana)}
                  transform={`translate(${f.x} ${f.y}) scale(${k})`}
                  onClick={() => tap(f.kana, true)}
                  data-testid={mini ? undefined : `fruit-${f.kana}`}
                >
                  <g className="fruit-in">
                    {!mini && <circle r={26} className="fruit-hit" />}
                    <ellipse cx={4} cy={-17} rx={6} ry={3} transform="rotate(-30 4 -17)" className="fruit-leaf" />
                    <circle r={16} fill={isGold ? 'url(#fruit-gold)' : `url(#fruit-${script})`} className="fruit-body" />
                    <circle cx={-6} cy={-6} r={3.5} className="fruit-shine" />
                    {!mini && (
                      <text y={6} className="fruit-kana">
                        {f.kana}
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      )}
      {full && !mini && (
        <g className="tree-sparkles" aria-hidden>
          {[
            [70, 60],
            [330, 50],
            [40, 200],
            [360, 220],
            [200, 20],
          ].map(([x, y], i) => (
            <text key={i} x={x} y={y} className="sparkle" style={{ animationDelay: `${i * 0.4}s` }}>
              ✦
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}

export default memo(LetterTree);

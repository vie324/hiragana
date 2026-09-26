/** かみふぶき (ぜんたいに 1まいの canvas) */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  color: string;
  shape: 'rect' | 'circle' | 'star';
  life: number;
  max: number;
}

const COLORS = ['#ff7eaa', '#ffd23f', '#4db4ff', '#4cc76f', '#a78bff', '#ff8f3f', '#ff6b6b'];

let canvas: HTMLCanvasElement | null = null;
let particles: Particle[] = [];
let raf = 0;
let last = 0;

export function attachConfetti(c: HTMLCanvasElement | null): void {
  canvas = c;
  resize();
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}

if (typeof window !== 'undefined') window.addEventListener('resize', resize);

function star(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function frame(t: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dt = Math.min(0.05, (t - (last || t)) / 1000);
  last = t;
  const dpr = canvas.width / window.innerWidth;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = particles.filter((p) => p.life < p.max && p.y < window.innerHeight + 40);
  for (const p of particles) {
    p.life += dt;
    p.vy += 900 * dt;
    p.vx *= 0.99;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const alpha = Math.max(0, 1 - Math.max(0, p.life - p.max * 0.7) / (p.max * 0.3));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
    else if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else star(ctx, p.r * 1.2);
    ctx.restore();
  }
  if (particles.length) raf = requestAnimationFrame(frame);
  else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    raf = 0;
    last = 0;
  }
}

/** x, y (画面の px) から はじける */
export function burst(opts: { x?: number; y?: number; count?: number; spread?: number; power?: number } = {}): void {
  if (!canvas) return;
  const x = opts.x ?? window.innerWidth / 2;
  const y = opts.y ?? window.innerHeight / 2;
  const n = opts.count ?? 60;
  const power = opts.power ?? 700;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * (opts.spread ?? Math.PI * 1.6);
    const v = power * (0.4 + Math.random() * 0.8);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      r: 5 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 12,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
      life: 0,
      max: 1.6 + Math.random() * 0.8,
    });
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

/** 要素の まんなかから はじける */
export function burstAt(el: Element | null, count = 40): void {
  if (!el) return burst({ count });
  const r = el.getBoundingClientRect();
  burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count });
}

/** 画面 ぜんたいに ふらせる */
export function celebrate(): void {
  const w = window.innerWidth;
  burst({ x: w * 0.2, y: window.innerHeight * 0.55, count: 50, spread: Math.PI * 0.9 });
  burst({ x: w * 0.8, y: window.innerHeight * 0.55, count: 50, spread: Math.PI * 0.9 });
  setTimeout(() => burst({ x: w / 2, y: window.innerHeight * 0.4, count: 60 }), 250);
}

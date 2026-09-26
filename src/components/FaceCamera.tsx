/**
 * かおしゃしんを とる (iPad の カメラ か、しゃしんから えらぶ)。
 * まるい わくに かおを あわせて、320px の しかくい JPEG に して onSave に わたす。
 * しゃしんは どこにも おくらず、この iPad の なかだけに ほぞんする。
 */
import { useEffect, useRef, useState } from 'react';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sound';
import './face.css';

type Source = { el: CanvasImageSource; w: number; h: number; zoom: number };
const OUT = 320;
const MAX_SRC = 1600;

function toCanvas(el: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const k = Math.min(1, MAX_SRC / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext('2d')!.drawImage(el, 0, 0, c.width, c.height);
  return c;
}

async function loadFile(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return toCanvas(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function FaceCamera({ onSave, onClose }: { onSave: (dataUrl: string) => void; onClose: () => void }) {
  const [step, setStep] = useState<'choose' | 'live' | 'adjust'>('choose');
  const [source, setSource] = useState<Source | null>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const canLive = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const c = await loadFile(f);
      setSource({ el: c, w: c.width, h: c.height, zoom: 1.4 });
      setStep('adjust');
      setMsg('');
    } catch {
      setMsg('この しゃしんは ひらけませんでした。べつの しゃしんを えらんでください。');
    }
  };

  return (
    <div className="overlay face-camera ui" role="dialog" aria-label="かおしゃしん">
      <div className="fc-card">
        {step === 'choose' && (
          <>
            <h2>かおしゃしんを いれる</h2>
            <p className="fc-note">正面を向いた、顔が大きく写っている写真がおすすめです。写真はこのiPadの中だけに保存されます。</p>
            <div className="fc-choices">
              {canLive && (
                <button className="btn orange" onClick={() => setStep('live')} data-testid="face-live">
                  <span className="emoji">📷</span> カメラで とる
                </button>
              )}
              <button className="btn blue" onClick={() => fileRef.current?.click()} data-testid="face-file">
                <span className="emoji">🖼️</span> しゃしんから えらぶ
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void pickFile(e.target.files?.[0])} data-testid="face-input" />
            {msg && <p className="fc-msg">{msg}</p>}
            <button className="fc-close secondary" onClick={onClose}>
              やめる
            </button>
          </>
        )}
        {step === 'live' && (
          <LiveCamera
            onShot={(c) => {
              setSource({ el: c, w: c.width, h: c.height, zoom: 1.2 });
              setStep('adjust');
            }}
            onFail={() => {
              setMsg('カメラが使えませんでした。「設定 → Safari → カメラ」で許可するか、「しゃしんから えらぶ」を使ってください。');
              setStep('choose');
            }}
            onCancel={() => setStep('choose')}
          />
        )}
        {step === 'adjust' && source && (
          <FaceAdjust
            source={source}
            onRetake={() => {
              setSource(null);
              setStep('choose');
            }}
            onDone={(url) => {
              sfx.sparkle();
              onSave(url);
            }}
          />
        )}
      </div>
    </div>
  );
}

function LiveCamera({ onShot, onFail, onCancel }: { onShot: (c: HTMLCanvasElement) => void; onFail: () => void; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(async (s) => {
        stream = s;
        if (!alive || !video.current) return s.getTracks().forEach((t) => t.stop());
        video.current.srcObject = s;
        await video.current.play().catch(() => undefined);
        if (alive) setReady(true);
      })
      .catch(() => alive && onFail());
    return () => {
      alive = false;
      timers.current.forEach(clearTimeout);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shoot = () => {
    const v = video.current;
    if (!v || !v.videoWidth || count) return;
    // 3, 2, 1 で とる
    [3, 2, 1].forEach((n, i) =>
      timers.current.push(
        setTimeout(() => {
          setCount(n);
          sfx.tap();
        }, i * 700),
      ),
    );
    timers.current.push(
      setTimeout(() => {
        setCount(0);
        const vw = v.videoWidth;
        const vh = v.videoHeight;
        const side = Math.min(vw, vh);
        const c = document.createElement('canvas');
        c.width = side;
        c.height = side;
        const ctx = c.getContext('2d')!;
        // プレビューと おなじ むき (かがみ) に する
        ctx.translate(side, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(v, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, side, side);
        sfx.stamp();
        void speak('はい、チーズ!');
        onShot(c);
      }, 2100),
    );
  };

  return (
    <>
      <h2>まるの なかに かおを いれてね</h2>
      <div className="fc-view">
        <video ref={video} playsInline muted autoPlay className="fc-video" />
        <div className="fc-guide" aria-hidden />
        {count > 0 && <div className="fc-count">{count}</div>}
      </div>
      <div className="fc-actions">
        <button className="secondary" onClick={onCancel}>
          もどる
        </button>
        <button className="btn green fc-shutter" onClick={shoot} disabled={!ready || count > 0} data-testid="face-shoot">
          <span className="emoji">📸</span> とる
        </button>
      </div>
    </>
  );
}

function FaceAdjust({ source, onDone, onRetake }: { source: Source; onDone: (dataUrl: string) => void; onRetake: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(source.zoom);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; zoom: number } | null>(null);

  /** はみだして すきまが できないように うごかせる はんいを きめる */
  const clamp = (o: { x: number; y: number }, z: number) => {
    const base = 1 / Math.min(source.w, source.h);
    const hx = Math.max(0, (source.w * base * z) / 2 - 0.5);
    const hy = Math.max(0, (source.h * base * z) / 2 - 0.5);
    return { x: Math.max(-hx, Math.min(hx, o.x)), y: Math.max(-hy, Math.min(hy, o.y)) };
  };

  const draw = (ctx: CanvasRenderingContext2D, size: number, o: { x: number; y: number }, z: number) => {
    const sc = (size / Math.min(source.w, source.h)) * z;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2 + o.x * size, size / 2 + o.y * size);
    ctx.scale(sc, sc);
    ctx.drawImage(source.el, -source.w / 2, -source.h / 2);
    ctx.restore();
  };

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    draw(c.getContext('2d')!, c.width, off, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [off, zoom]);

  const setZoomClamped = (z: number) => {
    const nz = Math.max(1, Math.min(4, z));
    setZoom(nz);
    setOff((o) => clamp(o, nz));
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      setZoomClamped((pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / Math.max(1, pinch.current.d));
      return;
    }
    const size = e.currentTarget.getBoundingClientRect().width || 1;
    setOff((o) => clamp({ x: o.x + (cur.x - prev.x) / size, y: o.y + (cur.y - prev.y) / size }, zoom));
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const save = () => {
    const c = document.createElement('canvas');
    c.width = OUT;
    c.height = OUT;
    draw(c.getContext('2d')!, OUT, off, zoom);
    onDone(c.toDataURL('image/jpeg', 0.86));
  };

  return (
    <>
      <h2>かおが まるの まんなかに なるように うごかしてね</h2>
      <div className="fc-view">
        <canvas
          ref={canvas}
          width={480}
          height={480}
          className="fc-canvas"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          data-testid="face-adjust"
        />
        <div className="fc-guide" aria-hidden />
      </div>
      <label className="fc-zoom">
        <span>おおきさ</span>
        <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => setZoomClamped(Number(e.target.value))} />
      </label>
      <div className="fc-actions">
        <button className="secondary" onClick={onRetake}>
          とりなおす
        </button>
        <button className="btn green" onClick={save} data-testid="face-save">
          <span className="emoji">✅</span> これに する
        </button>
      </div>
    </>
  );
}

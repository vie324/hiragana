/** こえを ろくおんして きく (えほんの 「よんでみよう」) */

export function canRecord(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

function pickMime(): string {
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']) {
    try {
      if (MediaRecorder.isTypeSupported?.(m)) return m;
    } catch {
      /* noop */
    }
  }
  return '';
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  get recording(): boolean {
    return this.rec?.state === 'recording';
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = pickMime();
    this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.rec.start();
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = this.rec;
      if (!rec || rec.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const blob = this.chunks.length ? new Blob(this.chunks, { type: rec.mimeType || 'audio/mp4' }) : null;
        this.cleanup();
        resolve(blob);
      };
      rec.stop();
    });
  }

  cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
  }
}

export function playBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  return new Promise((resolve) => {
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

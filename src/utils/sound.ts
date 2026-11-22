class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;

  public ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    try {
      if (this.ctx && this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
    } catch {
      // ignore resume errors
    }
    return this.ctx;
  }

  public tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    delay = 0,
    vol = 0.16
  ): void {
    if (!this.enabled) return;
    const c = this.ensure();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      const t = c.currentTime + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + duration + 0.05);
    } catch {
      // ignore audio context errors
    }
  }

  public correct(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone(f, 0.22, "triangle", i * 0.08, 0.18);
    });
  }

  public wrong(): void {
    this.tone(196, 0.3, "sawtooth", 0, 0.09);
    this.tone(147, 0.45, "sawtooth", 0.2, 0.09);
  }

  public click(): void {
    this.tone(880, 0.05, "square", 0, 0.04);
  }

  public tick(): void {
    this.tone(1250, 0.05, "sine", 0, 0.07);
  }

  public flip(): void {
    this.tone(600, 0.08, "triangle", 0, 0.1);
    this.tone(900, 0.1, "triangle", 0.07, 0.1);
  }

  public whoosh(): void {
    [330, 440, 554, 660, 880].forEach((f, i) => {
      this.tone(f, 0.2, "sine", i * 0.06, 0.1);
    });
  }

  public win(): void {
    [523, 523, 659, 784, 659, 784, 1046].forEach((f, i) => {
      this.tone(f, 0.28, "triangle", i * 0.14, 0.16);
    });
  }
}

export const Sound = new SoundEngine();

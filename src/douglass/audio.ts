/** Original instrumental score. It does not imitate or claim to reproduce the historical songs. */
export class CampaignAudio {
  context?: AudioContext;
  private gain?: GainNode;
  private interval?: number;
  private step = 0;
  private next = 0;
  private chapter = 1;
  private enabled = true;
  private speaking = false;
  private paused = false;
  constructor() {
    window.addEventListener('franklin-speech', this.speech);
  }
  private speech = (event: Event) => {
    this.speaking = (event as CustomEvent<boolean>).detail;
    this.mix();
  };
  private mix() {
    if (this.context)
      this.gain?.gain.setTargetAtTime(
        this.enabled ? (this.speaking ? 0.018 : this.paused ? 0.025 : 0.065) : 0,
        this.context.currentTime,
        0.12,
      );
  }
  start(chapter: number, enabled: boolean) {
    this.chapter = chapter;
    this.enabled = enabled;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.gain = this.context.createGain();
        this.gain.connect(this.context.destination);
        this.gain.gain.value = 0;
      }
      void this.context.resume().catch(() => {});
      this.mix();
      if (!this.interval) {
        this.next = this.context.currentTime + 0.1;
        this.interval = window.setInterval(() => this.schedule(), 40);
      }
    } catch {
      /* The entire campaign is playable without audio hardware. */
    }
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.mix();
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.mix();
  }
  private note(
    midi: number,
    at: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
  ) {
    if (!this.context || !this.gain) return;
    const osc = this.context.createOscillator(),
      env = this.context.createGain();
    osc.type = type;
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(volume, at + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(env);
    env.connect(this.gain);
    osc.start(at);
    osc.stop(at + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
  }
  private schedule() {
    if (!this.context) return;
    if (this.next < this.context.currentTime - 0.3) this.next = this.context.currentTime + 0.04;
    while (this.next < this.context.currentTime + 0.15) {
      const step = this.step++ % 32,
        root = [50, 53, 48, 55][Math.floor(step / 8)];
      if (this.enabled) {
        if (step % 8 === 0) {
          this.note(root - 12, this.next, 3, 0.7);
          this.note(root + 7, this.next, 2.8, 0.17);
        }
        this.note(
          root + [0, 7, 12, 10, 7, 3, 5, 7][step % 8],
          this.next,
          this.chapter === 2 ? 0.45 : 1,
          0.22,
          'triangle',
        );
        if (this.chapter === 2 && step % 2 === 0) this.note(31, this.next, 0.14, 0.5);
      }
      this.next += 60 / [84, 114, 96][this.chapter - 1] / 2;
    }
  }
  effect(kind: 'jump' | 'dash' | 'hit' | 'ring' | 'memory' | 'finish') {
    if (!this.context || !this.enabled) return;
    const t = this.context.currentTime;
    if (kind === 'memory' || kind === 'finish') {
      [62, 65, 69, 74].forEach((n, i) => this.note(n, t + i * 0.12, 0.8, 0.35));
    } else if (kind === 'ring') {
      this.note(79, t, 0.25, 0.45);
      this.note(86, t + 0.06, 0.3, 0.25);
    } else this.note(kind === 'hit' ? 36 : kind === 'jump' ? 62 : 49, t, 0.18, 0.35, 'triangle');
  }
  dispose() {
    window.removeEventListener('franklin-speech', this.speech);
    if (this.interval) clearInterval(this.interval);
    void this.context?.close().catch(() => {});
  }
}

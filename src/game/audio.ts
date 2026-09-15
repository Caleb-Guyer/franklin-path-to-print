/** Original procedural soundtrack and arcade effects; no downloads or audio services. */
export class GameAudio {
  private context?: AudioContext;
  private musicGain?: GainNode;
  private effectsGain?: GainNode;
  private interval?: number;
  private step = 0;
  private next = 0;
  private theme = 0;
  private enabled = true;
  private effects = true;
  private noise?: AudioBuffer;
  start(music: boolean, effects: boolean, theme: number) {
    this.enabled = music;
    this.effects = effects;
    this.theme = theme;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.musicGain = this.context.createGain();
        this.effectsGain = this.context.createGain();
        this.musicGain.connect(this.context.destination);
        this.effectsGain.connect(this.context.destination);
      }
      if (!this.musicGain || !this.effectsGain) return;
      this.musicGain.gain.value = music ? 0.16 : 0;
      this.effectsGain.gain.value = effects ? 0.2 : 0;
      void this.context.resume().catch(() => {});
      if (!this.interval) {
        this.next = this.context.currentTime + 0.06;
        this.interval = window.setInterval(() => this.schedule(), 25);
      }
    } catch {
      /* Gameplay also works without audio hardware. */
    }
  }
  setMusic(enabled: boolean) {
    this.enabled = enabled;
    this.effects = enabled;
    if (this.context && this.musicGain)
      this.musicGain.gain.setTargetAtTime(enabled ? 0.16 : 0, this.context.currentTime, 0.08);
    if (this.effectsGain) this.effectsGain.gain.value = enabled ? 0.2 : 0;
  }
  pause(paused: boolean) {
    if (this.context && this.musicGain)
      this.musicGain.gain.setTargetAtTime(
        this.enabled ? (paused ? 0.045 : 0.16) : 0,
        this.context.currentTime,
        0.12,
      );
  }
  private tone(
    frequency: number,
    time: number,
    duration: number,
    gain: number,
    type: OscillatorType = 'triangle',
    effects = false,
    endFrequency?: number,
  ) {
    const context = this.context;
    const bus = effects ? this.effectsGain : this.musicGain;
    if (!context || !bus) return;
    const osc = context.createOscillator(),
      envelope = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(envelope);
    envelope.connect(bus);
    osc.start(time);
    osc.stop(time + duration + 0.03);
    osc.onended = () => {
      osc.disconnect();
      envelope.disconnect();
    };
  }
  private percussion(time: number, strong: boolean) {
    const context = this.context;
    if (!context || !this.musicGain) return;
    if (!this.noise) {
      this.noise = context.createBuffer(1, context.sampleRate * 0.12, context.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
    }
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = this.noise;
    filter.type = 'highpass';
    filter.frequency.value = strong ? 1800 : 7500;
    gain.gain.value = strong ? 0.25 : 0.09;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    source.start(time);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  private schedule() {
    const context = this.context;
    if (!context || !this.enabled) return;
    if (this.next < context.currentTime - 0.5) this.next = context.currentTime + 0.04;
    while (this.next < context.currentTime + 0.12) {
      const step = this.step++ % 128,
        bar = Math.floor(step / 16),
        beat = step % 16;
      const base = [57, 55, 60, 62][this.theme % 4];
      const root = base + [0, 0, 5, 5, 3, 3, 7, 5][bar];
      const scale = [0, 3, 5, 7, 10, 12, 15, 17];
      const melody = [0, 2, 3, 4, 3, 2, 1, 2, 0, 3, 5, 4, 2, 1, 3, 2];
      const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
      if (beat % 2 === 0)
        this.tone(
          hz(root + 12 + scale[melody[(beat + bar * 3) % 16] % 8]),
          this.next,
          0.18,
          0.19,
          'triangle',
        );
      if (beat % 4 === 0) {
        this.tone(hz(root - 12 + (beat === 8 ? 7 : 0)), this.next, 0.32, 0.48);
        this.tone(85, this.next, 0.1, 0.7, 'sine', false, 38);
      }
      if (beat === 4 || beat === 12) this.percussion(this.next, true);
      else if (beat % 2 === 0) this.percussion(this.next, false);
      if (beat === 0) {
        this.tone(hz(root), this.next, 1.5, 0.09, 'sine');
        this.tone(hz(root + 7), this.next, 1.3, 0.07, 'sine');
      }
      this.next += 60 / (112 + (this.theme % 3) * 6) / 4;
    }
  }
  play(name: 'jump' | 'dash' | 'page' | 'hit' | 'bounce' | 'checkpoint' | 'clear', chain = 1) {
    if (!this.context || !this.effects) return;
    const t = this.context.currentTime;
    if (name === 'jump') this.tone(180, t, 0.13, 0.35, 'square', true, 410);
    if (name === 'dash') this.tone(600, t, 0.12, 0.25, 'sawtooth', true, 90);
    if (name === 'page') {
      const pitch = Math.pow(2, (Math.min(chain - 1, 7) * 2) / 12);
      this.tone(700 * pitch, t, 0.09, 0.38, 'triangle', true);
      this.tone(1040 * pitch, t + 0.06, 0.16, 0.3, 'triangle', true);
    }
    if (name === 'hit') this.tone(150, t, 0.2, 0.5, 'sawtooth', true, 45);
    if (name === 'bounce') this.tone(160, t, 0.22, 0.4, 'square', true, 650);
    if (name === 'checkpoint' || name === 'clear')
      [0, 4, 7, 12].forEach((n, i) =>
        this.tone(440 * Math.pow(2, n / 12), t + i * 0.1, 0.28, 0.3, 'triangle', true),
      );
  }
  dispose() {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    void this.context?.close().catch(() => {});
  }
}

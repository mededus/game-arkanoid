/**
 * AudioManager — procedural SFX and background music via Web Audio API.
 * All sound is generated in code; no audio asset files are needed.
 */
export class AudioManager {
  constructor(scene) {
    this._ctx = scene.sound.context;

    this._master = this._ctx.createGain();
    this._master.gain.value = 0.55;
    this._master.connect(this._ctx.destination);

    this._sfxBus = this._ctx.createGain();
    this._sfxBus.gain.value = 1.0;
    this._sfxBus.connect(this._master);

    this._musicBus = this._ctx.createGain();
    this._musicBus.gain.value = 0.30;
    this._musicBus.connect(this._master);

    this._seqStep  = 0;
    this._nextTime = 0;
    this._timerID  = null;
    this._running  = false;

    this._startMusic();
  }

  _note(type, freq, bus, t, dur, peak, end = 0.0001) {
    const ctx = this._ctx; const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(peak, t); gain.gain.exponentialRampToValueAtTime(end, t + dur);
    osc.connect(gain); gain.connect(bus); osc.start(t); osc.stop(t + dur + 0.01);
  }

  _sweep(type, f0, f1, bus, t, dur, peak) {
    const ctx = this._ctx; const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f0, t); osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gain.gain.setValueAtTime(peak, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain); gain.connect(bus); osc.start(t); osc.stop(t + dur + 0.01);
  }

  playWallHit()      { this._sweep('square',   700,  350, this._sfxBus, this._ctx.currentTime, 0.055, 0.22); }
  playPaddleHit()    { const t = this._ctx.currentTime; this._sweep('sine', 400, 250, this._sfxBus, t, 0.075, 0.35); this._note('square', 900, this._sfxBus, t, 0.02, 0.12); }
  playBrickHit()     { this._sweep('square',   480,  240, this._sfxBus, this._ctx.currentTime, 0.065, 0.18); }
  playLifeLost()     { this._sweep('sawtooth', 440,   55, this._sfxBus, this._ctx.currentTime, 0.85,  0.45); }
  playLaserFire()    { this._sweep('sawtooth', 1500, 380, this._sfxBus, this._ctx.currentTime, 0.11,  0.18); }

  playBrickDestroy() {
    const ctx = this._ctx; const t = ctx.currentTime; const dur = 0.13;
    const len = Math.ceil(ctx.sampleRate * dur); const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0); for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
    filt.frequency.setValueAtTime(1400, t); filt.frequency.exponentialRampToValueAtTime(280, t + dur); filt.Q.value = 1.8;
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt); filt.connect(gain); gain.connect(this._sfxBus); src.start(t); src.stop(t + dur + 0.01);
    this._sweep('square', 960, 480, this._sfxBus, t, 0.09, 0.16);
  }

  playPowerUp() {
    const t = this._ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => this._note('square', f, this._sfxBus, t + i * 0.06, 0.10, 0.28));
  }

  playLevelComplete() {
    const t = this._ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((f, i) => this._note('square', f, this._sfxBus, t + i * 0.09, 0.14, 0.38));
  }

  static _MELODY = [
    784, 0, 659, 0, 587, 659, 784, 0,
    880, 0, 784, 0, 659,   0, 587, 0,
    659, 784, 880, 784, 659, 587, 659, 0,
    587, 0, 659, 587, 523,   0,   0, 0,
  ];

  static _BASS = [
    196, 0, 0, 0, 147, 0, 0, 0,
    220, 0, 0, 0, 147, 0, 196, 0,
    196, 0, 0, 0, 147, 0, 0, 0,
    220, 0, 0, 0, 196, 0, 0, 0,
  ];

  static _BPM      = 135;
  static _STEP_DUR = 60 / AudioManager._BPM / 4;
  static _SEQ_LEN  = 32;

  _startMusic() {
    if (this._running) return;
    this._running  = true; this._seqStep = 0;
    this._nextTime = this._ctx.currentTime + 0.05;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    this._pump();
  }

  stopMusic() {
    this._running = false; clearTimeout(this._timerID); this._timerID = null;
    const g = this._musicBus.gain;
    g.cancelScheduledValues(this._ctx.currentTime);
    g.setValueAtTime(g.value, this._ctx.currentTime);
    g.linearRampToValueAtTime(0.0001, this._ctx.currentTime + 0.4);
  }

  _pump() {
    if (!this._running) return;
    while (this._nextTime < this._ctx.currentTime + 0.25) {
      this._playStep(this._seqStep, this._nextTime);
      this._nextTime += AudioManager._STEP_DUR;
      this._seqStep = (this._seqStep + 1) % AudioManager._SEQ_LEN;
    }
    this._timerID = setTimeout(() => this._pump(), 100);
  }

  _playStep(step, t) {
    const gate = AudioManager._STEP_DUR * 0.80;
    const mf = AudioManager._MELODY[step];
    if (mf) {
      const ctx = this._ctx; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = mf;
      gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(1.0, t + 0.006);
      gain.gain.setValueAtTime(1.0, t + gate * 0.55); gain.gain.linearRampToValueAtTime(0.0001, t + gate);
      osc.connect(gain); gain.connect(this._musicBus); osc.start(t); osc.stop(t + gate + 0.01);
    }
    const bf = AudioManager._BASS[step];
    if (bf) {
      const ctx = this._ctx; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = bf;
      gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(0.85, t + 0.010);
      gain.gain.setValueAtTime(0.85, t + gate * 0.45); gain.gain.linearRampToValueAtTime(0.0001, t + gate);
      osc.connect(gain); gain.connect(this._musicBus); osc.start(t); osc.stop(t + gate + 0.01);
    }
  }

  destroy() {
    this.stopMusic();
    setTimeout(() => { try { this._sfxBus.disconnect(); this._musicBus.disconnect(); this._master.disconnect(); } catch (_) {} }, 500);
  }
}

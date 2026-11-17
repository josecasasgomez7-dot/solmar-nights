// All sound is synthesised with WebAudio oscillators — no audio files, no
// network. Created lazily on the first user gesture (browsers block audio
// before that); the screenshot path never touches it.

export function createAudio() {
  let ctx = null, master = null, musicTimer = null, muted = false;
  let step = 0;
  const NOTES = [196, 246.9, 293.7, 392, 329.6, 246.9, 220, 196];
  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.16; master.connect(ctx.destination);
      return true;
    } catch { return false; }
  }
  function tone(freq, dur, type = 'sine', vol = 0.5, when = 0) {
    if (!ensure() || muted || !ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function startMusic() {
    if (!ensure() || musicTimer) return;
    musicTimer = setInterval(() => {
      if (muted || !ctx || document.hidden) return;
      const n = NOTES[step % NOTES.length]; step += 1;
      tone(n, 0.42, 'triangle', 0.22);
      if (step % 4 === 0) tone(n / 2, 0.5, 'sine', 0.18);
    }, 300);
  }
  return {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); startMusic(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    punch() { tone(120, 0.12, 'square', 0.5); tone(70, 0.15, 'sawtooth', 0.4); },
    pickup() { tone(660, 0.1, 'sine', 0.5); tone(880, 0.14, 'sine', 0.5, 0.08); },
    cash() { tone(523, 0.1, 'triangle', 0.5); tone(659, 0.1, 'triangle', 0.5, 0.09); tone(784, 0.2, 'triangle', 0.5, 0.18); },
    siren() { tone(880, 0.35, 'sine', 0.22); tone(660, 0.35, 'sine', 0.22, 0.35); },
    crash() { tone(90, 0.25, 'sawtooth', 0.6); tone(55, 0.3, 'square', 0.4); },
    busted() { tone(220, 0.4, 'sawtooth', 0.5); tone(165, 0.6, 'sawtooth', 0.5, 0.35); },
    engine() { tone(55, 0.18, 'sawtooth', 0.12); },
    horn() { tone(370, 0.18, 'square', 0.3); tone(466, 0.18, 'square', 0.3); },
  };
}

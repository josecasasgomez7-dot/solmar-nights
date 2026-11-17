// Every sound is synthesised with WebAudio oscillators — no audio files and
// no network. The context is created lazily on the first user gesture,
// because browsers block audio before that; the screenshot path never
// touches it, and the music is a quiet latin-flavoured loop of notes.

export function createAudio() {
  let ctx = null, master = null, musicTimer = null, muted = false;
  let step = 0;
  // A minor-key loop that feels like a warm Solmar night.
  const NOTES = [220, 261.6, 293.7, 329.6, 392, 329.6, 293.7, 261.6];
  const BASS = [110, 110, 130.8, 98];
  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
      return true;
    } catch { return false; }
  }
  function tone(freq, dur, type = 'sine', vol = 0.5, when = 0) {
    if (!ensure() || muted || !ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function startMusic() {
    if (!ensure() || musicTimer) return;
    musicTimer = setInterval(() => {
      if (muted || !ctx || document.hidden) return;
      const n = NOTES[step % NOTES.length];
      tone(n, 0.42, 'triangle', 0.2);
      if (step % 4 === 0) tone(BASS[(step / 4) % BASS.length], 0.55, 'sine', 0.2);
      step += 1;
    }, 300);
  }
  return {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); startMusic(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    punch() { tone(120, 0.12, 'square', 0.5); tone(70, 0.15, 'sawtooth', 0.4); },
    pickup() { tone(660, 0.1, 'sine', 0.5); tone(880, 0.14, 'sine', 0.5, 0.08); },
    coin() { tone(988, 0.08, 'triangle', 0.45); tone(1319, 0.16, 'triangle', 0.45, 0.07); },
    cash() { tone(523, 0.1, 'triangle', 0.5); tone(659, 0.1, 'triangle', 0.5, 0.09); tone(784, 0.2, 'triangle', 0.5, 0.18); },
    mission() { tone(392, 0.12, 'triangle', 0.45); tone(523, 0.12, 'triangle', 0.45, 0.1); tone(659, 0.22, 'triangle', 0.45, 0.2); },
    wanted() { tone(330, 0.16, 'sawtooth', 0.35); tone(311, 0.2, 'sawtooth', 0.35, 0.14); },
    siren() { tone(880, 0.35, 'sine', 0.2); tone(660, 0.35, 'sine', 0.2, 0.35); },
    crash() { tone(90, 0.25, 'sawtooth', 0.6); tone(55, 0.3, 'square', 0.4); },
    busted() { tone(220, 0.4, 'sawtooth', 0.5); tone(165, 0.6, 'sawtooth', 0.5, 0.35); },
    engine() { tone(55, 0.18, 'sawtooth', 0.12); },
    horn() { tone(370, 0.18, 'square', 0.3); tone(466, 0.18, 'square', 0.3); },
    click() { tone(520, 0.06, 'sine', 0.3); },
  };
}

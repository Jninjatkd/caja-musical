let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Plays a delicate mechanical brass lock click when the golden key turns inside the lock.
 */
export function playLockClickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Crisp mechanical latch click (short filtered impulse + metallic ping)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(920, now);
  osc1.frequency.exponentialRampToValueAtTime(280, now + 0.055);
  gain1.gain.setValueAtTime(0.18, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.07);

  // Secondary spring release click slightly after
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1480, now + 0.09);
  osc2.frequency.exponentialRampToValueAtTime(640, now + 0.14);
  gain2.gain.setValueAtTime(0.12, now + 0.09);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.09);
  osc2.stop(now + 0.16);
}

/**
 * Plays a soft music-box celesta chime when the box unlocks and begins opening.
 */
export function playMusicBoxChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [1046.5, 1318.5, 1567.98]; // C6 - E6 - G6 gentle arpeggio

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.075, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.58);
  });
}

/**
 * Web Audio API retro synthesizer for 8-bit sound effects
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    // Standard AudioContext initialization
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a retro Jump sound (ascending pitch sweep)
 */
export function playJumpSound(volumeSetting: number) {
  if (volumeSetting <= 0) return;
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; // Classic retro square wave
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(700, time + 0.15);

    gain.gain.setValueAtTime(volumeSetting * 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.16);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

/**
 * Play a retro Slide/Duck sound (rapid descending pitch sweep)
 */
export function playSlideSound(volumeSetting: number) {
  if (volumeSetting <= 0) return;
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);

    gain.gain.setValueAtTime(volumeSetting * 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.13);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

/**
 * Play a retro Coin sound (ascending arpeggio C5 to G5)
 */
export function playCoinSound(volumeSetting: number) {
  if (volumeSetting <= 0) return;
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // Mellower pulse
    
    // Arpeggio note 1
    osc.frequency.setValueAtTime(523.25, time); // C5
    // Arpeggio note 2
    osc.frequency.setValueAtTime(783.99, time + 0.08); // G5 or C6 (1046.50)

    gain.gain.setValueAtTime(volumeSetting * 0.15, time);
    gain.gain.setValueAtTime(volumeSetting * 0.15, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.26);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

/**
 * Play a retro Explosion / Crash sound (rumbly pitch drop + noise filter feel)
 */
export function playExplosionSound(volumeSetting: number) {
  if (volumeSetting <= 0) return;
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, time);
    osc.frequency.linearRampToValueAtTime(30, time + 0.4);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(140, time);
    osc2.frequency.linearRampToValueAtTime(10, time + 0.35);

    gain.gain.setValueAtTime(volumeSetting * 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.5);
    osc2.stop(time + 0.5);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

/**
 * Play a success sound / state-change sound (ascending retro scale)
 */
export function playSuccessSound(volumeSetting: number) {
  if (volumeSetting <= 0) return;
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, time); // C4
    osc.frequency.setValueAtTime(329.63, time + 0.08); // E4
    osc.frequency.setValueAtTime(392.00, time + 0.16); // G4
    osc.frequency.setValueAtTime(523.25, time + 0.24); // C5

    gain.gain.setValueAtTime(volumeSetting * 0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.41);
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
}

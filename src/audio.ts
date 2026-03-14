import Phaser from 'phaser';
import { sfxr } from 'jsfxr';

const BLINK_COUNT = 5;
const BLINK_INTERVAL = 70; // ms per blink toggle

// Menu select sound params (sawtooth blip designed in sfxr.me)
const SELECT_SOUND_DEF = {
  oldParams: true,
  wave_type: 1,
  p_env_attack: 0,
  p_env_sustain: 0.02727193042081071,
  p_env_punch: 0.3719218275602389,
  p_env_decay: 0.2806954521471867,
  p_base_freq: 0.6417857495222331,
  p_freq_limit: 0,
  p_freq_ramp: 0,
  p_freq_dramp: 0,
  p_vib_strength: 0,
  p_vib_speed: 0,
  p_arp_mod: 0.5313118378337934,
  p_arp_speed: 0.5340896727515815,
  p_duty: 0,
  p_duty_ramp: 0,
  p_repeat_speed: 0,
  p_pha_offset: 0,
  p_pha_ramp: 0,
  p_lpf_freq: 1,
  p_lpf_ramp: 0,
  p_lpf_resonance: 0,
  p_hpf_freq: 0,
  p_hpf_ramp: 0,
  sound_vol: 0.25,
  sample_rate: 44100,
  sample_size: 8,
};

// Lazy-initialized on first use
let selectAudio: ReturnType<typeof sfxr.toAudio> | null = null;

export function playSelectSound(): void {
  if (!selectAudio) selectAudio = sfxr.toAudio(SELECT_SOUND_DEF);
  selectAudio.play();
}

interface BlinkTarget {
  obj: Phaser.GameObjects.BitmapText | Phaser.GameObjects.Sprite;
  tint: number; // restore color on even blinks
  toggleVisible?: boolean; // toggle visibility instead of tint
}

/**
 * NES-style blink + select sound, then call onComplete.
 * Targets alternate between white (0xffffff) and their restore tint.
 */
export function blinkTransition(
  scene: Phaser.Scene,
  targets: BlinkTarget[],
  onComplete: () => void
): void {
  playSelectSound();

  let blinks = 0;
  const totalToggles = BLINK_COUNT * 2;

  scene.time.addEvent({
    delay: BLINK_INTERVAL,
    repeat: totalToggles - 1,
    callback: () => {
      blinks++;
      const isWhite = blinks % 2 === 1;

      for (const t of targets) {
        if (t.toggleVisible) {
          t.obj.setVisible(!isWhite);
        } else {
          (t.obj as Phaser.GameObjects.BitmapText).setTint(isWhite ? 0xffffff : t.tint);
        }
      }

      if (blinks === totalToggles) {
        onComplete();
      }
    },
  });
}

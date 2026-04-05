/**
 * Global Audio System for Samka (Lync)
 * Provides high-performance, singleton audio playback for tactile UI feedback.
 */

class AudioSystem {
  private static instance: AudioSystem;
  private clickSound: HTMLAudioElement | null = null;
  private correctSound: HTMLAudioElement | null = null;
  private wrongSound: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.clickSound = new Audio("/click.mp3");
      this.clickSound.preload = "auto";
      
      this.correctSound = new Audio("/correct.mp3");
      this.correctSound.preload = "auto";
      
      this.wrongSound = new Audio("/wrong.mp3");
      this.wrongSound.preload = "auto";
    }
  }

  public static getInstance(): AudioSystem {
    if (!AudioSystem.instance) {
      AudioSystem.instance = new AudioSystem();
    }
    return AudioSystem.instance;
  }

  private playSound(audio: HTMLAudioElement | null) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  public playClick() {
    this.playSound(this.clickSound);
  }

  public playCorrect() {
    this.playSound(this.correctSound);
  }

  public playWrong() {
    this.playSound(this.wrongSound);
  }
}

export const playClickSound = () => {
  if (typeof window === "undefined") return;
  AudioSystem.getInstance().playClick();
};

export const playCorrectSound = () => {
  if (typeof window === "undefined") return;
  AudioSystem.getInstance().playCorrect();
};

export const playWrongSound = () => {
  if (typeof window === "undefined") return;
  AudioSystem.getInstance().playWrong();
};

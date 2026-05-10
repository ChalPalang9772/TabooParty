'use client';

import { Howl } from 'howler';

class SoundManager {
  private sounds: Record<string, Howl> = {};
  private enabled: boolean = true;

  constructor() {
    if (typeof window === 'undefined') return;

    this.sounds = {
      click: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'], volume: 0.5 }),
      correct: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.6 }),
      wrong: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'], volume: 0.4 }),
      timer_tick: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'], volume: 0.3 }),
      timer_urgent: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'], volume: 0.5, loop: true }),
      combo: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3'], volume: 0.7 }),
      game_over: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2576/2576-preview.mp3'], volume: 0.8 }),
      bonus: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3'], volume: 0.6 }),
    };
  }

  play(name: string) {
    if (!this.enabled || !this.sounds[name]) return;
    this.sounds[name].play();
  }

  stop(name: string) {
    if (this.sounds[name]) this.sounds[name].stop();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
  }
}

export const sounds = typeof window !== 'undefined' ? new SoundManager() : null;

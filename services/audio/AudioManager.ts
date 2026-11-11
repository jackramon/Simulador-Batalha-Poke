
import { TRACK_URLS, BGM_BATTLE_NORMAL } from '../../data/audioTracks';

class AudioManager {
  private static instance: AudioManager;
  private sfxVolume: number = 0.5; // 0.0 to 1.0 (SFX)
  private musicVolume: number = 0.3; // 0.0 to 1.0 (BGM)
  private audioCtx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement;
  private currentTrack: string | null = null;
  private currentUrl: string | null = null;
  private userInteracted: boolean = false; // Flag to track if user has interacted with the page
  private fadeInterval: any = null; // Interval for fading logic

  private constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported');
    }

    if (typeof Audio !== 'undefined') {
      this.bgmAudio = new Audio();
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.musicVolume;

      // Robust Error Handling: Fallback to Normal theme if a specific track fails to load/play
      this.bgmAudio.addEventListener('error', (e) => {
          console.warn(`[Audio] Error loading track: ${this.bgmAudio.src}`, e);
          
          // Prevent infinite loop if Normal track also fails
          if (this.currentTrack !== BGM_BATTLE_NORMAL) {
              console.log('[Audio] Falling back to Normal BGM');
              this.playMusic(BGM_BATTLE_NORMAL);
          }
      });
    } else {
      this.bgmAudio = {
        loop: false,
        volume: 0,
        src: '',
        paused: true,
        currentTime: 0,
        play: () => Promise.resolve(),
        pause: () => {},
        addEventListener: () => {}
      } as unknown as HTMLAudioElement;
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // --- AUDIO CONTEXT CONTROL ---

  /**
   * Must be called inside a user interaction event (click/keydown) to unlock audio.
   */
  public resumeContext() {
    this.userInteracted = true;
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(e => console.warn('[Audio] Context Resume Failed:', e));
    }

    // If a track was queued but blocked by lack of interaction, play it now
    if (this.currentUrl && this.bgmAudio.paused) {
        // Instead of instant play, call playMusic to trigger the fade-in correctly
        if (this.currentTrack) this.playMusic(this.currentTrack);
    }
  }

  // --- SFX CONTROL ---

  public setMasterVolume(percent: number) {
    const clamped = Math.max(0, Math.min(100, percent));
    this.sfxVolume = clamped / 100;

    if (this.audioCtx && this.audioCtx.state === 'suspended' && this.sfxVolume > 0 && this.userInteracted) {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public getMasterVolume(): number {
    return Math.round(this.sfxVolume * 100);
  }

  // --- MUSIC CONTROL ---

  public setMusicVolume(percent: number) {
    const clamped = Math.max(0, Math.min(100, percent));
    this.musicVolume = clamped / 100;
    
    // If not currently fading, update immediately. 
    // If fading, the interval loop will pick up the new target volume.
    if (!this.fadeInterval) {
        this.bgmAudio.volume = this.musicVolume;
    }
  }

  public getMusicVolume(): number {
    return Math.round(this.musicVolume * 100);
  }

  public playMusic(trackKey: string) {
    let url = TRACK_URLS[trackKey];

    // Fallback Logic: If no specific URL, use Normal Battle
    if (!url) {
        url = TRACK_URLS[BGM_BATTLE_NORMAL];
    }

    if (!url) {
        this.stopMusic();
        return;
    }

    // Optimization: If the same URL is already playing, do not restart
    if (this.currentUrl === url && !this.bgmAudio.paused) {
        this.currentTrack = trackKey; // Update logical state just in case
        return;
    }

    // Define the Fade In function to run after Fade Out (or immediately if stopped)
    const startFadeIn = () => {
        this.currentTrack = trackKey;
        this.currentUrl = url!;
        this.bgmAudio.src = url!;
        this.bgmAudio.volume = 0; // Start at 0

        if (!this.userInteracted) {
            console.log('[Audio] Playback queued - waiting for user interaction');
            return; 
        }

        const playPromise = this.bgmAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Fade In Logic
                clearInterval(this.fadeInterval);
                this.fadeInterval = setInterval(() => {
                    // Smoothly ramp up to target volume
                    if (this.bgmAudio.volume < this.musicVolume) {
                        // Increase by ~5% every 50ms (~1 second fade in)
                        const nextVol = Math.min(this.musicVolume, this.bgmAudio.volume + 0.05);
                        this.bgmAudio.volume = nextVol;
                    } else {
                        // Reached target
                        this.bgmAudio.volume = this.musicVolume;
                        clearInterval(this.fadeInterval);
                        this.fadeInterval = null;
                    }
                }, 50);
            }).catch(e => {
                console.debug('[Audio] Autoplay prevented or load failed:', e);
            });
        }
    };

    // If audio is playing, Fade Out first
    if (!this.bgmAudio.paused && this.bgmAudio.volume > 0) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = setInterval(() => {
            // Decrease by ~10% every 50ms (~0.5 second fade out)
            if (this.bgmAudio.volume > 0.05) {
                this.bgmAudio.volume = Math.max(0, this.bgmAudio.volume - 0.1);
            } else {
                this.bgmAudio.volume = 0;
                clearInterval(this.fadeInterval);
                this.bgmAudio.pause();
                startFadeIn(); // Start the next track
            }
        }, 50);
    } else {
        // If stopped, just Fade In
        startFadeIn();
    }
  }

  public stopMusic() {
    // Immediate stop or fade out could be implemented here. 
    // For now, immediate stop to ensure silence when requested.
    clearInterval(this.fadeInterval);
    this.fadeInterval = null;
    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0;
    this.currentTrack = null;
    this.currentUrl = null;
  }

  // --- PLAYBACK METHODS ---

  public playCry(url?: string) {
    if (this.sfxVolume <= 0 || !url || !this.userInteracted) return;
    try {
      const audio = new Audio(url);
      audio.volume = this.sfxVolume;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Error creating audio', e);
    }
  }

  public playSfx(type: 'hit' | 'super-effective' | 'not-very-effective' | 'faint') {
    if (this.sfxVolume <= 0 || !this.audioCtx || !this.userInteracted) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      const vol = this.sfxVolume;

      switch (type) {
        case 'super-effective':
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
          gain.gain.setValueAtTime(0.2 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;

        case 'not-very-effective':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.1);
          gain.gain.setValueAtTime(0.2 * vol, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;

        case 'faint':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(10, now + 0.8);
          gain.gain.setValueAtTime(0.3 * vol, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.8);
          osc.start(now);
          osc.stop(now + 0.8);
          break;

        case 'hit':
        default:
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
          gain.gain.setValueAtTime(0.15 * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
      }
    } catch (e) {
      console.warn('SFX Synth Error', e);
    }
  }
}

export default AudioManager.getInstance();

export class AudioNotificationService {
  private static sounds = {
    default: '/sounds/notification.mp3',
    success: '/sounds/success.mp3',
    warning: '/sounds/warning.mp3',
    error: '/sounds/error.mp3',
  };

  private static audioContext: AudioContext | null = null;
  private static enabled = true;
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    }
  }

  static setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationSoundsEnabled', String(enabled));
    }
  }

  static isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== 'false';
  }

  static async play(type: 'default' | 'success' | 'warning' | 'error' = 'default') {
    if (!this.enabled || !this.isEnabled()) return;

    // Initialize on first play if needed
    if (!this.initialized) {
      this.init();
    }

    const audio = new Audio(this.sounds[type]);
    audio.volume = 0.5;
    
    try {
      await audio.play();
    } catch (error) {
      // Audio playback failed (autoplay policy, browser restrictions, etc.) - silently ignore
    }
  }
}

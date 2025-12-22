export class AudioNotificationService {
  private static sounds = {
    default: '/sounds/notification.mp3',
    success: '/sounds/success.mp3',
    warning: '/sounds/warning.mp3',
    error: '/sounds/error.mp3',
  };

  private static audioContext: AudioContext | null = null;
  private static enabled = true;

  static init() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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

    const audio = new Audio(this.sounds[type]);
    audio.volume = 0.5;
    
    try {
      await audio.play();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }
}

// Initialiser au chargement
if (typeof window !== 'undefined') {
  AudioNotificationService.init();
}

export class DesktopNotificationService {
  private static permission: NotificationPermission = 'default';

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  static show(title: string, options?: NotificationOptions) {
    if (this.permission !== 'granted') return;

    const notifOptions: any = {
      icon: '/notification-icon.png',
      badge: '/badge-icon.png',
      vibrate: [200, 100, 200],
      ...options,
    };

    const notification = new Notification(title, notifOptions);

    notification.onclick = () => {
      window.focus();
      if (options?.data?.url) {
        // Validate URL to prevent potential security issues
        try {
          const url = new URL(options.data.url, window.location.origin);
          // Only allow same-origin URLs with http/https protocols
          if (url.origin === window.location.origin &&
            (url.protocol === 'http:' || url.protocol === 'https:')) {
            window.location.assign(url.href);
          }
        } catch (e) {
          // Invalid URL - silently ignore
        }
      }
      notification.close();
    };

    return notification;
  }
}

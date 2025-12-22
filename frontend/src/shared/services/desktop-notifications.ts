export class DesktopNotificationService {
  private static permission: NotificationPermission = 'default';

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
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

    const notification = new Notification(title, {
      icon: '/notification-icon.png',
      badge: '/badge-icon.png',
      vibrate: [200, 100, 200],
      ...options,
    });

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
          console.warn('Invalid notification URL:', options.data.url);
        }
      }
      notification.close();
    };

    return notification;
  }
}

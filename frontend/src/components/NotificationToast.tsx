import React, { useEffect, useState } from 'react';
import { Notification, getNotificationTypeIcon, getNotificationTypeColor } from '../shared/utils/notifications-api';

/**
 * 🍞 Composant Toast pour afficher les notifications en temps réel
 *
 * Fonctionnalités:
 * - Animation d'entrée/sortie
 * - Auto-dismiss après 5 secondes
 * - Clic pour fermer
 * - Couleur par type
 * - Son optionnel
 */

export interface NotificationToastProps {
  notification: Notification;
  onClose?: () => void;
  onAction?: (notification: Notification) => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
  playSound?: boolean;
}

export function NotificationToast({
  notification,
  onClose,
  onAction,
  autoDismiss = true,
  dismissDelay = 5000,
  playSound = true,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    // Petit délai pour l'animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleClose();
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay]);

  // Jouer un son
  useEffect(() => {
    if (playSound && typeof window !== 'undefined') {
      try {
        // Utiliser l'API Web Audio pour jouer un son simple
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // Fréquence du son
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (err) {
        // Ignorer les erreurs de son (pas critique)
        console.debug('Could not play notification sound:', err);
      }
    }
  }, [playSound]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Durée de l'animation de sortie
  };

  const handleAction = () => {
    onAction?.(notification);
    handleClose();
  };

  const icon = getNotificationTypeIcon(notification.type);
  const colorClass = getNotificationTypeColor(notification.type);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isClosing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          max-w-md w-full
          bg-white rounded-lg shadow-2xl border-l-4
          ${colorClass}
          overflow-hidden
          hover:shadow-xl transition-shadow
        `}
      >
        {/* Progress bar */}
        {autoDismiss && (
          <div className="h-1 bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all ease-linear"
              style={{
                animation: `shrink ${dismissDelay}ms linear`,
              }}
            ></div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 text-3xl">
              {icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {notification.title}
              </p>
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                {notification.message}
              </p>

              {/* Channel badge */}
              {notification.channel && notification.channel !== 'in_app' && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    📡 {notification.channel}
                  </span>
                </div>
              )}

              {/* Action button */}
              {notification.link && (
                <button
                  onClick={handleAction}
                  className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Voir →
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Fermer"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 📚 Conteneur de Toasts pour empiler plusieurs notifications
 */
export interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  onAction?: (notification: Notification) => void;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function NotificationToastContainer({
  notifications,
  onClose,
  onAction,
  maxToasts = 3,
  position = 'top-right',
}: NotificationToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  // Limiter le nombre de toasts affichés
  const visibleNotifications = notifications.slice(0, maxToasts);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2`}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * -10}px)`,
            zIndex: 50 - index,
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onClose(notification.id)}
            onAction={onAction}
          />
        </div>
      ))}
    </div>
  );
}

export default NotificationToast;

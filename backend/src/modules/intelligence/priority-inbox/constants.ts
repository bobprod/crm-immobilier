/**
 * Constants pour le module Priority Inbox
 */

export const URGENT_KEYWORDS = [
  'urgent',
  'immédiat',
  'aujourd\'hui',
  'maintenant',
  'rapidement',
  'vite',
  'pressé',
  'asap',
];

export const NOTIFICATION_FATIGUE_THRESHOLD = 5; // notifications per hour
export const NOTIFICATION_FATIGUE_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export const PRIORITY_SCORE_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
  LOW: 0,
};

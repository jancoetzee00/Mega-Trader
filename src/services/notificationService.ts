import { AppNotificationItem, AppNotificationType, NotificationSettings } from '../types';

const STORAGE_KEY = 'ai_trader_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  browserNotificationsEnabled: true,
  audioChimesEnabled: true,
  notifyOnOpen: true,
  notifyOnCloseTP: true,
  notifyOnCloseSL: true,
  notifyOnBreakeven: true,
};

// Load saved settings
export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load notification settings', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

// Save settings
export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings', e);
  }
}

// Check native notification support
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Web Audio Synthesizer for MT5 & Trading Floor Sound FX (No external MP3 files required)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playTradingAudioChime(type: AppNotificationType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'TRADE_OPEN') {
      // Upbeat two-tone MT5 order chime: E5 (659Hz) -> A5 (880Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
      
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'TRADE_CLOSE_TP') {
      // Celebratory Major 7th arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.31);
      });
    } else if (type === 'TRADE_CLOSE_SL') {
      // Risk Capped / Cautionary two-tone descent: A4 (440Hz) -> F4 (349Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440.0, now);
      osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.15);

      // Filter to soften the sawtooth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.41);
    } else if (type === 'TRADE_BREAKEVEN') {
      // High subtle ping: G5 (784Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

// In-app Toast Subscriber Event System
type ToastListener = (toast: AppNotificationItem) => void;
const toastListeners: Set<ToastListener> = new Set();

export function subscribeToAppToasts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function notifyToastSubscribers(toast: AppNotificationItem): void {
  toastListeners.forEach(listener => {
    try {
      listener(toast);
    } catch (err) {
      console.error('Toast listener error:', err);
    }
  });
}

/**
 * Primary trigger function for AI Auto-Trader position events.
 * Handles:
 * 1. Native browser Notification popup
 * 2. In-app toast popups
 * 3. Audio Chime execution
 */
export function sendTradingNotification(item: AppNotificationItem, userSettings?: NotificationSettings): void {
  const settings = userSettings || getNotificationSettings();

  // Check if this type of notification is enabled in settings
  if (item.type === 'TRADE_OPEN' && !settings.notifyOnOpen) return;
  if (item.type === 'TRADE_CLOSE_TP' && !settings.notifyOnCloseTP) return;
  if (item.type === 'TRADE_CLOSE_SL' && !settings.notifyOnCloseSL) return;
  if (item.type === 'TRADE_BREAKEVEN' && !settings.notifyOnBreakeven) return;

  // 1. Play Audio Chime
  if (settings.audioChimesEnabled) {
    playTradingAudioChime(item.type);
  }

  // 2. Dispatch In-App Toast
  notifyToastSubscribers(item);

  // 3. Send Native Browser Notification
  if (settings.browserNotificationsEnabled && isBrowserNotificationSupported()) {
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(item.title, {
          body: item.message,
          icon: '/favicon.ico',
          tag: `ai-trade-${item.id}`,
          silent: true, // We already handle our customized harmonic chimes
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          try { notif.close(); } catch (e) {}
        }, 5000);

        notif.onclick = () => {
          window.focus();
          try { notif.close(); } catch (e) {}
        };
      } catch (err) {
        console.warn('Browser Notification delivery notice:', err);
      }
    }
  }
}

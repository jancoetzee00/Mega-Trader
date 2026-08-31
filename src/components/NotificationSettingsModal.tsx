import React, { useState, useEffect } from 'react';
import { NotificationSettings } from '../types';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  getBrowserNotificationPermission, 
  requestBrowserNotificationPermission,
  isBrowserNotificationSupported,
  sendTradingNotification,
  playTradingAudioChime
} from '../services/notificationService';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Bot, 
  Zap, 
  Sliders,
  Send,
  Radio
} from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      setPermission(getBrowserNotificationPermission());
    }
  }, [isOpen]);

  const handleToggle = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      const updated = { ...settings, browserNotificationsEnabled: true };
      setSettings(updated);
      saveNotificationSettings(updated);
      setTestStatus('Browser notification permission successfully granted!');
      setTimeout(() => setTestStatus(null), 4000);
    }
  };

  const handleTestAlert = (type: 'OPEN' | 'TP' | 'SL') => {
    const timeStr = new Date().toLocaleTimeString();
    if (type === 'OPEN') {
      sendTradingNotification({
        id: `test-open-${Date.now()}`,
        type: 'TRADE_OPEN',
        title: '🤖 AI Auto-Trader: Opened BUY Position',
        message: 'XAUUSD 0.50 Lots @ $2,498.50 | SL: $2,492.00 | TP: $2,514.00 (AuraBreak Trend Signal)',
        timestamp: timeStr,
        orderType: 'BUY',
        symbol: 'XAUUSD',
        ticket: 994812,
        price: 2498.50,
      }, settings);
      setTestStatus('Dispatched test position OPEN alert!');
    } else if (type === 'TP') {
      sendTradingNotification({
        id: `test-tp-${Date.now()}`,
        type: 'TRADE_CLOSE_TP',
        title: '🎯 AI Auto-Trader: TAKE PROFIT HIT!',
        message: 'Closed #994812 XAUUSD at Target $2,514.00 • Net Profit: +$775.00 USD (+2.4R Win)',
        timestamp: timeStr,
        pnl: 775.00,
        symbol: 'XAUUSD',
        ticket: 994812,
      }, settings);
      setTestStatus('Dispatched test TAKE PROFIT alert!');
    } else {
      sendTradingNotification({
        id: `test-sl-${Date.now()}`,
        type: 'TRADE_CLOSE_SL',
        title: '🛡️ AI Auto-Trader: Stop Loss Executed',
        message: 'Closed #994812 XAUUSD at $2,492.00 • Protective Risk Capped at -$325.00 USD',
        timestamp: timeStr,
        pnl: -325.00,
        symbol: 'XAUUSD',
        ticket: 994812,
      }, settings);
      setTestStatus('Dispatched test STOP LOSS alert!');
    }
    setTimeout(() => setTestStatus(null), 3000);
  };

  if (!isOpen) return null;

  const isSupported = isBrowserNotificationSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0B0F19] border border-white/15 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Live Trade Notifications
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                  BROWSER & DESKTOP
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Receive instant alerts when the AI opens or closes positions in live simulation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* Browser Notification Permission Status Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Browser Push Permission Status
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  permission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : permission === 'denied'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {permission}
              </span>
            </div>

            {permission !== 'granted' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Allow your web browser to send notifications so you receive real-time alerts even when working on other tabs.
                </p>
                <button
                  onClick={handleRequestPermission}
                  disabled={!isSupported}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Grant Browser Notification Permission
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Browser notifications active. In-app and desktop alerts will display automatically.</span>
              </div>
            )}
          </div>

          {/* Master Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Browser Push Notifications</div>
                  <div className="text-[11px] text-slate-400">Display OS/browser notifications on order activity</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('browserNotificationsEnabled')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.browserNotificationsEnabled ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    settings.browserNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white">Synthesized Audio Chimes (MT5 FX)</div>
                  <div className="text-[11px] text-slate-400">Play instant harmonic sound alerts on trade execution</div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('audioChimesEnabled')}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                  settings.audioChimesEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    settings.audioChimesEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Trigger Event Filter Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trigger Notification Events
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 1. Open */}
              <label className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition">
                <span className="text-xs text-slate-200">Position Opened (BUY/SELL)</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnOpen}
                  onChange={() => handleToggle('notifyOnOpen')}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
                />
              </label>

              {/* 2. TP */}
              <label className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition">
                <span className="text-xs text-slate-200">Take Profit Win (TP)</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnCloseTP}
                  onChange={() => handleToggle('notifyOnCloseTP')}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4"
                />
              </label>

              {/* 3. SL */}
              <label className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition">
                <span className="text-xs text-slate-200">Stop Loss Hit (SL)</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnCloseSL}
                  onChange={() => handleToggle('notifyOnCloseSL')}
                  className="rounded border-slate-700 text-rose-500 focus:ring-0 w-4 h-4"
                />
              </label>

              {/* 4. Breakeven */}
              <label className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/10 transition">
                <span className="text-xs text-slate-200">Break-Even Auto Move</span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnBreakeven}
                  onChange={() => handleToggle('notifyOnBreakeven')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Test Buttons Section */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Test Live Notifications
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Immediate Dispatch</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTestAlert('OPEN')}
                className="py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition text-center cursor-pointer"
              >
                Test Open Alert
              </button>
              <button
                type="button"
                onClick={() => handleTestAlert('TP')}
                className="py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition text-center cursor-pointer"
              >
                Test TP Win Alert
              </button>
              <button
                type="button"
                onClick={() => handleTestAlert('SL')}
                className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition text-center cursor-pointer"
              >
                Test SL Alert
              </button>
            </div>

            {testStatus && (
              <p className="text-xs text-emerald-400 text-center font-mono animate-fade-in">
                ✓ {testStatus}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Settings auto-saved locally.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

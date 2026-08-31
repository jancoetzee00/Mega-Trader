import React, { useState, useEffect } from 'react';
import { AppNotificationItem } from '../types';
import { subscribeToAppToasts } from '../services/notificationService';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  Bell, 
  ArrowUpRight, 
  ArrowDownRight,
  Volume2
} from 'lucide-react';

interface ToastWithTimer extends AppNotificationItem {
  createdAt: number;
}

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastWithTimer[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToAppToasts((newToast) => {
      const toastWithTimer: ToastWithTimer = {
        ...newToast,
        createdAt: Date.now(),
      };
      setToasts((prev) => [toastWithTimer, ...prev].slice(0, 4)); // Max 4 concurrent toasts
    });

    return unsubscribe;
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => now - t.createdAt < 6000));
    }, 500);

    return () => clearInterval(timer);
  }, [toasts]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        const isTP = toast.type === 'TRADE_CLOSE_TP';
        const isSL = toast.type === 'TRADE_CLOSE_SL';
        const isOpen = toast.type === 'TRADE_OPEN';
        const isBE = toast.type === 'TRADE_BREAKEVEN';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform animate-in slide-in-from-bottom-5 relative overflow-hidden ${
              isTP
                ? 'bg-slate-950/95 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : isSL
                ? 'bg-slate-950/95 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
                : isOpen
                ? 'bg-slate-950/95 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                : 'bg-slate-950/95 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
            }`}
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20 ${
                isTP ? 'bg-emerald-500' : isSL ? 'bg-rose-500' : isOpen ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
            />

            <div className="flex items-start gap-3 relative z-10">
              {/* Icon */}
              <div
                className={`p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center ${
                  isTP
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isSL
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : isOpen
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                }`}
              >
                {isTP && <Sparkles className="w-5 h-5" />}
                {isSL && <ShieldAlert className="w-5 h-5" />}
                {isOpen && <Bot className="w-5 h-5" />}
                {isBE && <ShieldCheck className="w-5 h-5" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isTP
                        ? 'text-emerald-300'
                        : isSL
                        ? 'text-rose-300'
                        : isOpen
                        ? 'text-amber-300'
                        : 'text-cyan-300'
                    }`}
                  >
                    {toast.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {toast.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {toast.message}
                </p>

                {/* Additional PnL Badge if closed */}
                {toast.pnl !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                        toast.pnl >= 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {toast.pnl >= 0 ? '+' : ''}${toast.pnl.toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isTP ? 'Target Achieved' : 'Risk Capped'}
                    </span>
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div
                className={`h-full animate-[shrink_6s_linear] ${
                  isTP ? 'bg-emerald-400' : isSL ? 'bg-rose-400' : isOpen ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

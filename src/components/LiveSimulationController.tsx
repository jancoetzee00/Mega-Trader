import React, { useState, useEffect, useCallback } from 'react';
import { Candle, StrategyConfig, Trade } from '../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Bell, 
  Volume2,
  Keyboard,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { getBrowserNotificationPermission } from '../services/notificationService';

interface LiveSimulationControllerProps {
  candles: Candle[];
  trades: Trade[];
  config: StrategyConfig;
  activeCandleIndex: number;
  setActiveCandleIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onOpenNotificationModal?: () => void;
}

export const LiveSimulationController: React.FC<LiveSimulationControllerProps> = ({
  candles,
  trades,
  config,
  activeCandleIndex,
  setActiveCandleIndex,
  isPlaying,
  setIsPlaying,
  onOpenNotificationModal,
}) => {
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  useEffect(() => {
    setNotifPermission(getBrowserNotificationPermission());
  }, []);

  const speeds = [1, 2, 5, 10];

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setActiveCandleIndex((p) => Math.min(candles.length - 1, p + 1));
  }, [candles.length, setActiveCandleIndex, setIsPlaying]);

  const handleStepBackward = useCallback(() => {
    setIsPlaying(false);
    setActiveCandleIndex((p) => Math.max(0, p - 1));
  }, [setActiveCandleIndex, setIsPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveCandleIndex(35);
  }, [setActiveCandleIndex, setIsPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing inside an input, textarea or editable field
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Check if any modal is open (dialog role)
      if (document.querySelector('[role="dialog"]') && !document.querySelector('[role="dialog"]')?.contains(target)) {
        // Allow keys unless interacting inside modal
      }

      // 1. Space -> Toggle Play / Pause
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
        setLastKeyPressed(isPlaying ? '⏸ Paused' : '▶ Playing');
        setTimeout(() => setLastKeyPressed(null), 1200);
        return;
      }

      // 2. Arrow Right -> Step Forward 1 Candle
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
        setLastKeyPressed('→ Step Forward');
        setTimeout(() => setLastKeyPressed(null), 1200);
        return;
      }

      // 3. Arrow Left -> Step Backward 1 Candle
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
        setLastKeyPressed('← Step Back');
        setTimeout(() => setLastKeyPressed(null), 1200);
        return;
      }

      // 4. Arrow Up -> Increase Speed
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSpeed((prev) => {
          const currentIndex = speeds.indexOf(prev);
          const nextIndex = Math.min(speeds.length - 1, currentIndex + 1);
          const nextSpeed = speeds[nextIndex];
          setLastKeyPressed(`⚡ Speed: ${nextSpeed}x`);
          setTimeout(() => setLastKeyPressed(null), 1200);
          return nextSpeed;
        });
        return;
      }

      // 5. Arrow Down -> Decrease Speed
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSpeed((prev) => {
          const currentIndex = speeds.indexOf(prev);
          const nextIndex = Math.max(0, currentIndex - 1);
          const nextSpeed = speeds[nextIndex];
          setLastKeyPressed(`⚡ Speed: ${nextSpeed}x`);
          setTimeout(() => setLastKeyPressed(null), 1200);
          return nextSpeed;
        });
        return;
      }

      // 6. 'r' or 'R' -> Reset Simulation
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
        setLastKeyPressed('↺ Reset');
        setTimeout(() => setLastKeyPressed(null), 1200);
        return;
      }

      // 7. Number keys 1, 2, 5, 0 (for 10x) -> Direct speed setting
      if (e.key === '1') {
        setSpeed(1);
        setLastKeyPressed('⚡ Speed: 1x');
        setTimeout(() => setLastKeyPressed(null), 1200);
      } else if (e.key === '2') {
        setSpeed(2);
        setLastKeyPressed('⚡ Speed: 2x');
        setTimeout(() => setLastKeyPressed(null), 1200);
      } else if (e.key === '5') {
        setSpeed(5);
        setLastKeyPressed('⚡ Speed: 5x');
        setTimeout(() => setLastKeyPressed(null), 1200);
      } else if (e.key === '0') {
        setSpeed(10);
        setLastKeyPressed('⚡ Speed: 10x');
        setTimeout(() => setLastKeyPressed(null), 1200);
      } else if (e.key === '?' || e.key === '/') {
        setShowShortcutHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleStepForward, handleStepBackward, handleReset, isPlaying, speeds]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(80, 750 / speed);
    const timer = setInterval(() => {
      setActiveCandleIndex((prev) => {
        if (prev >= candles.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, candles.length, setActiveCandleIndex, setIsPlaying]);

  const currentCandle = candles[activeCandleIndex] || candles[candles.length - 1];

  // Find trades up to this candle
  const executedTrades = trades.filter((t) => t.openTime <= currentCandle.time);
  const activeTrade = executedTrades.find((t) => !t.closeTime || t.closeTime > currentCandle.time);

  // Generate dynamic live execution log for terminal
  const currentLogs = React.useMemo(() => {
    const logs: { time: string; msg: string; type: 'info' | 'trade' | 'warn' | 'success' }[] = [];

    logs.push({
      time: currentCandle.timeStr,
      msg: `[OnTick] Bar Sync @ ${currentCandle.close.toFixed(2)} | ATR: ${currentCandle.atr?.toFixed(2) || '1.20'} | Spread: ${config.maxSpreadPoints / 10} pts`,
      type: 'info',
    });

    if (activeTrade) {
      logs.push({
        time: currentCandle.timeStr,
        msg: `[ACTIVE POSITION] #${activeTrade.ticket} ${activeTrade.type} ${activeTrade.lotSize}L @ ${activeTrade.openPrice} | Current SL: ${activeTrade.currentSl}`,
        type: 'warn',
      });
    } else {
      const isBull = currentCandle.close > (currentCandle.emaTrend || 0);
      logs.push({
        time: currentCandle.timeStr,
        msg: `[SIGNAL SCANNER] Market Trend Bias: ${isBull ? 'BULLISH CONTINUATION' : 'BEARISH PULLBACK'} | Waiting for trigger...`,
        type: 'info',
      });
    }

    const latestClosed = executedTrades.filter((t) => t.closeTime && t.closeTime <= currentCandle.time).slice(-3);
    for (const t of latestClosed) {
      logs.push({
        time: t.closeTimeStr || '',
        msg: `[DEAL CLOSED] Ticket #${t.ticket} ${t.type} PnL: ${t.profit > 0 ? '+' : ''}$${t.profit.toFixed(2)} (${t.exitReason})`,
        type: t.profit > 0 ? 'success' : 'warn',
      });
    }

    return logs;
  }, [currentCandle, activeTrade, executedTrades, config]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080A] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Simulation Controls Strip */}
      <div className="p-4 border-b border-white/5 bg-[#050507]/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Play / Pause with [Space] indicator */}
            <button
              id="sim-play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause Ticker (Space)' : 'Play Live Feed (Space)'}
              className={`p-2.5 rounded-lg font-bold font-mono flex items-center gap-2 text-xs shadow-lg transition active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE TICKER' : 'PLAY LIVE FEED'}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-sans font-bold bg-black/25 text-black/90 rounded border border-black/20">
                Space
              </kbd>
            </button>

            {/* Step Back [Left Arrow] */}
            <button
              id="sim-step-back-btn"
              onClick={handleStepBackward}
              title="Step Backward 1 Candle (← Left Arrow)"
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition cursor-pointer flex items-center gap-1 text-xs font-mono"
            >
              <SkipBack className="h-4 w-4" />
              <kbd className="hidden md:inline-block px-1 py-0.5 text-[9px] font-sans text-slate-400 bg-white/5 rounded border border-white/10">
                ←
              </kbd>
            </button>

            {/* Step Forward [Right Arrow] */}
            <button
              id="sim-step-forward-btn"
              onClick={handleStepForward}
              title="Step Forward 1 Candle (→ Right Arrow)"
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition cursor-pointer flex items-center gap-1 text-xs font-mono"
            >
              <SkipForward className="h-4 w-4" />
              <kbd className="hidden md:inline-block px-1 py-0.5 text-[9px] font-sans text-slate-400 bg-white/5 rounded border border-white/10">
                →
              </kbd>
            </button>

            {/* Reset [R key] */}
            <button
              id="sim-reset-btn"
              onClick={handleReset}
              title="Reset Simulation (R)"
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition cursor-pointer flex items-center gap-1 text-xs font-mono"
            >
              <RotateCcw className="h-4 w-4" />
              <kbd className="hidden md:inline-block px-1 py-0.5 text-[9px] font-sans text-slate-400 bg-white/5 rounded border border-white/10">
                R
              </kbd>
            </button>
          </div>

          {/* Speed Selector with Up/Down indication */}
          <div className="flex items-center bg-[#050507] rounded-lg border border-white/10 p-1 text-xs font-mono">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                title={`Set speed to ${s}x (Keys: 1, 2, 5, 0 or ↑/↓)`}
                className={`px-2.5 py-1 rounded transition cursor-pointer ${
                  speed === s
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Keyboard Shortcut Help Toggle Button */}
          <button
            id="sim-keyboard-help-btn"
            onClick={() => setShowShortcutHelp((prev) => !prev)}
            title="View Keyboard Shortcuts (?)"
            className={`p-2 rounded-lg border text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
              showShortcutHelp
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/10'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span className="hidden xl:inline text-[11px]">KEYS</span>
          </button>
        </div>

        {/* Real-time Shortcut Feedback Pill */}
        {lastKeyPressed && (
          <div className="animate-in fade-in zoom-in-95 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            {lastKeyPressed}
          </div>
        )}

        {/* Progress Bar & Notification Trigger Pill */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400 flex-1 max-w-xs sm:max-w-lg justify-end">
          {onOpenNotificationModal && (
            <button
              onClick={onOpenNotificationModal}
              id="sim-notif-btn"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
                notifPermission === 'granted'
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
              title="Configure Browser & Sound Notifications for AI Orders"
            >
              <Bell className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">ALERTS:</span>
              <span className="font-bold">{notifPermission === 'granted' ? 'ACTIVE' : 'SETUP'}</span>
            </button>
          )}

          <span>BAR {activeCandleIndex + 1}/{candles.length}</span>
          <div className="w-24 sm:w-36 bg-[#050507] h-2 rounded-full overflow-hidden border border-white/5">
            <div
              className="bg-amber-500 h-full transition-all duration-150 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${((activeCandleIndex + 1) / candles.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Expandable Keyboard Shortcuts Reference Bar */}
      {showShortcutHelp && (
        <div className="p-3 bg-[#0B0F19] border-b border-cyan-500/20 text-xs font-sans flex flex-wrap items-center justify-between gap-3 text-slate-300 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
            <Keyboard className="w-4 h-4" />
            <span>GLOBAL SHORTCUTS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">Space</kbd>
              <span className="text-slate-400">Play / Pause</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">→</kbd>
              <span className="text-slate-400">Step Bar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">↓</kbd>
              <span className="text-slate-400">Speed (1x/2x/5x/10x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">R</kbd>
              <span className="text-slate-400">Reset</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 bg-white/10 rounded border border-white/20 text-white font-bold">1/2/5/0</kbd>
              <span className="text-slate-400">Preset Speed</span>
            </div>
          </div>

          <button
            onClick={() => setShowShortcutHelp(false)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* Real-time Order & Tick Terminal Feed */}
      <div className="p-4 bg-[#050507] font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5 mb-2 font-mono">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 tracking-wider">
            <Terminal className="h-3.5 w-3.5" />
            <span>MQL5 EXPERT ADVISOR LIVE CONSOLE LOGS</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            MT5 ENGINE ACTIVE
          </span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {currentLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] font-mono">
              <span className="text-slate-600 select-none">[{log.time}]</span>
              <span
                className={`${
                  log.type === 'trade'
                    ? 'text-cyan-300 font-bold'
                    : log.type === 'success'
                    ? 'text-emerald-400 font-bold'
                    : log.type === 'warn'
                    ? 'text-amber-300 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


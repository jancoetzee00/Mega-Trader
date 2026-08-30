import React, { useState, useEffect } from 'react';
import { Candle, StrategyConfig, Trade } from '../types';
import { Play, Pause, SkipForward, RotateCcw, Zap, Terminal, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface LiveSimulationControllerProps {
  candles: Candle[];
  trades: Trade[];
  config: StrategyConfig;
  activeCandleIndex: number;
  setActiveCandleIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const LiveSimulationController: React.FC<LiveSimulationControllerProps> = ({
  candles,
  trades,
  config,
  activeCandleIndex,
  setActiveCandleIndex,
  isPlaying,
  setIsPlaying,
}) => {
  const [speed, setSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x

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
            <button
              id="sim-play-pause-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-lg font-bold font-mono flex items-center gap-2 text-xs shadow-lg transition active:scale-95 ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE TICKER' : 'PLAY LIVE FEED'}</span>
            </button>

            <button
              id="sim-step-btn"
              onClick={() => {
                setIsPlaying(false);
                setActiveCandleIndex((p) => Math.min(candles.length - 1, p + 1));
              }}
              title="Step Forward 1 Candle"
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              id="sim-reset-btn"
              onClick={() => {
                setIsPlaying(false);
                setActiveCandleIndex(35);
              }}
              title="Reset Simulation"
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#050507] rounded-lg border border-white/10 p-1 text-xs font-mono">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded transition ${
                  speed === s
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-400 flex-1 max-w-xs sm:max-w-md">
          <span>BAR {activeCandleIndex + 1}/{candles.length}</span>
          <div className="w-full bg-[#050507] h-2 rounded-full overflow-hidden border border-white/5">
            <div
              className="bg-amber-500 h-full transition-all duration-150 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ width: `${((activeCandleIndex + 1) / candles.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

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

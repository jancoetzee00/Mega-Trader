import React, { useState } from 'react';
import { BacktestResults, StrategyConfig } from '../types';
import { TrendingUp, ShieldCheck, Target, Percent, DollarSign, Activity, Award, BarChart3, AlertTriangle, Cloud, Check } from 'lucide-react';

interface PerformanceDashboardProps {
  results: BacktestResults;
  config: StrategyConfig;
  onSaveToCloud?: () => Promise<void>;
  isLoggedIn?: boolean;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ 
  results, 
  config,
  onSaveToCloud,
  isLoggedIn
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const isProfit = results.netProfit >= 0;
  const returnPct = ((results.netProfit / results.initialBalance) * 100).toFixed(1);

  const handleCloudSave = async () => {
    if (!onSaveToCloud) return;
    setIsSaving(true);
    try {
      await onSaveToCloud();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate SVG points for the equity curve
  const equityPoints = results.equityCurve;
  const minEquity = Math.min(...equityPoints.map((p) => Math.min(p.balance, p.equity)));
  const maxEquity = Math.max(...equityPoints.map((p) => Math.max(p.balance, p.equity)));
  const equityRange = maxEquity - minEquity || 100;

  const chartWidth = 640;
  const chartHeight = 180;
  const padding = 20;

  const getX = (index: number) => {
    if (equityPoints.length <= 1) return padding;
    return padding + (index / (equityPoints.length - 1)) * (chartWidth - padding * 2);
  };

  const getY = (val: number) => {
    return chartHeight - padding - ((val - minEquity) / equityRange) * (chartHeight - padding * 2);
  };

  const balancePath = equityPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.balance)}`)
    .join(' ');

  const equityAreaPath =
    equityPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.equity)}`).join(' ') +
    ` L ${getX(equityPoints.length - 1)} ${chartHeight - padding} L ${getX(0)} ${chartHeight - padding} Z`;

  return (
    <div className="space-y-4">
      {/* 8-Card Quantitative Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Net Profit */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">NET P/L</span>
            <DollarSign className={`h-3.5 w-3.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="mt-2">
            <div className={`text-base sm:text-lg font-bold font-mono tracking-tight ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfit ? '+' : ''}${results.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              {isProfit ? '+' : ''}{returnPct}% ROI
            </div>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">PROFIT FACTOR</span>
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              {results.profitFactor >= 99 ? 'MAX' : results.profitFactor.toFixed(2)}
            </div>
            <div className="text-[10.5px] text-amber-400 font-mono mt-0.5 font-semibold">
              {results.profitFactor >= 1.5 ? 'EDGE 1.5+' : 'BASELINE'}
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">WIN RATE</span>
            <Target className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-cyan-300">
              {results.winRate.toFixed(1)}%
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              {results.winningTrades}W / {results.losingTrades}L
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">MAX DRAWDOWN</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-rose-400">
              {results.maxDrawdownPercent.toFixed(1)}%
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              -${results.maxDrawdownAmount.toFixed(0)} peak
            </div>
          </div>
        </div>

        {/* Total Trades */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">EXECUTIONS</span>
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              {results.totalTrades}
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              ~{(results.totalTrades / 7).toFixed(1)} trades/day
            </div>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">SHARPE RATIO</span>
            <Award className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-amber-300">
              {results.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              Annualized
            </div>
          </div>
        </div>

        {/* Risk / Reward */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">RISK / REWARD</span>
            <Percent className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              1:{results.riskRewardRatio > 0 ? results.riskRewardRatio.toFixed(1) : (config.tpAtrMultiplier / config.slAtrMultiplier).toFixed(1)}
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              Target 1:{(config.tpAtrMultiplier / config.slAtrMultiplier).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Expectancy / Avg Trade */}
        <div className="p-3 rounded-xl bg-[#08080A] border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500">EXPECTANCY</span>
            <Activity className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className={`text-base sm:text-lg font-bold font-mono ${results.avgTrade >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${results.avgTrade.toFixed(1)}
            </div>
            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
              per trade edge
            </div>
          </div>
        </div>
      </div>

      {/* Equity Curve & Risk Exposure Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity Curve Chart */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-[#08080A] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                ACCOUNT EQUITY & BALANCE CURVE
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono border border-white/5">
                Start: ${config.accountBalance.toLocaleString()} → End: ${results.finalBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              {onSaveToCloud && isLoggedIn && (
                <button
                  onClick={handleCloudSave}
                  disabled={isSaving || savedSuccess}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold transition border cursor-pointer ${
                    savedSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 hover:bg-amber-500/20 text-amber-300 border-slate-700 hover:border-amber-500/40'
                  }`}
                  title="Archive this backtest performance run to Firestore Cloud"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Archived</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3 h-3 text-amber-400" />
                      <span>{isSaving ? 'Saving...' : 'Archive Run'}</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                <span className="text-slate-300">Equity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span>
                <span className="text-slate-300">Balance</span>
              </div>
            </div>
          </div>

          {/* SVG Equity Area */}
          <div className="w-full h-44 sm:h-48 relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#161822" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#161822" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#161822" strokeDasharray="3 3" />

              {/* Shaded Area Under Equity */}
              <path d={equityAreaPath} fill="url(#equityGrad)" />

              {/* Balance Line */}
              <path d={balancePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Risk & Commodity Execution Profiler */}
        <div className="p-4 rounded-xl bg-[#08080A] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3 font-mono">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              MT5 RISK ENGINE TELEMETRY
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Position Sizing Mode</span>
                <span className="font-mono font-bold text-amber-300">
                  {config.useRiskPercent ? `${config.riskPercent}% Equity Risk` : `${config.fixedLotSize} Fixed Lots`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Daily Loss Circuit Breaker</span>
                <span className="font-mono font-bold text-rose-400">-{config.maxDailyLossPercent}% Max</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Trailing Stop Engine</span>
                <span className="font-mono font-bold text-emerald-400">
                  {config.useTrailingStop ? `${config.trailingStopAtrMultiplier}x ATR` : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Break-Even Protection</span>
                <span className="font-mono font-bold text-cyan-300">
                  {config.useBreakEven ? `Locked at +${config.breakEvenTriggerR}R` : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Session Window (GMT)</span>
                <span className="font-mono font-bold text-slate-200">
                  {config.useTimeFilter ? `${config.startHour}:00 - ${config.endHour}:00 GMT` : '24h Continuous'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
            <span className="text-amber-400 font-bold font-mono">PROTOCOL:</span>
            <span>
              Gold (XAUUSD) spreads widen to 30-50+ points during Asian session roll. The built-in spread filter blocks low-liquidity slippage entries.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

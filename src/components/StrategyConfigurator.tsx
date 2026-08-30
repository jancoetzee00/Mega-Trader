import React from 'react';
import { StrategyConfig, StrategyPreset } from '../types';
import { DEFAULT_CONFIGS } from '../data/presets';
import { Sliders, Shield, Zap, Clock, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

interface StrategyConfiguratorProps {
  config: StrategyConfig;
  onChangeConfig: (newConfig: StrategyConfig) => void;
  onApplyPreset: (preset: StrategyPreset) => void;
  currentPreset: StrategyPreset;
}

export const StrategyConfigurator: React.FC<StrategyConfiguratorProps> = ({
  config,
  onChangeConfig,
  onApplyPreset,
  currentPreset,
}) => {
  const updateField = <K extends keyof StrategyConfig>(field: K, value: StrategyConfig[K]) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080A] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Header & Presets Bar */}
      <div className="p-4 border-b border-white/5 bg-[#050507]/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">EA Input Parameters & Risk Engine</h3>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono hidden sm:inline uppercase">STRATEGY PRESETS:</span>
          <button
            onClick={() => onApplyPreset('AuraBreak_Gold')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition flex items-center gap-1.5 ${
              currentPreset === 'AuraBreak_Gold'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <span>Gold (AuraBreak)</span>
          </button>

          <button
            onClick={() => onApplyPreset('PetroPulse_Oil')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition flex items-center gap-1.5 ${
              currentPreset === 'PetroPulse_Oil'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <span>Oil (PetroPulse)</span>
          </button>

          <button
            onClick={() => onApplyPreset('ApexHybrid_Multi')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition flex items-center gap-1.5 ${
              currentPreset === 'ApexHybrid_Multi'
                ? 'bg-indigo-500 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <span>Hybrid Multi-Asset</span>
          </button>
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Risk & Account Money Management */}
        <div className="space-y-3 p-3 rounded-xl bg-[#050507]/90 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase font-mono tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            <span>[1] Risk Management</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 flex justify-between">
              <span>Risk Sizing Mode</span>
              <span className="text-white font-mono font-medium">
                {config.useRiskPercent ? '% Equity Risk' : 'Fixed Lot'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1 mt-1 font-mono">
              <button
                type="button"
                onClick={() => updateField('useRiskPercent', true)}
                className={`py-1 text-xs rounded font-semibold transition ${
                  config.useRiskPercent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                % Risk
              </button>
              <button
                type="button"
                onClick={() => updateField('useRiskPercent', false)}
                className={`py-1 text-xs rounded font-semibold transition ${
                  !config.useRiskPercent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                Fixed Lot
              </button>
            </div>
          </div>

          {config.useRiskPercent ? (
            <div>
              <label className="text-[11px] text-slate-400 flex justify-between">
                <span>Risk per Trade</span>
                <span className="text-amber-400 font-mono font-bold">{config.riskPercent}%</span>
              </label>
              <input
                type="range"
                min="0.25"
                max="5.0"
                step="0.25"
                value={config.riskPercent}
                onChange={(e) => updateField('riskPercent', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#08080A] rounded-lg appearance-none cursor-pointer accent-amber-500 mt-1"
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-slate-400 flex justify-between">
                <span>Fixed Lot Size</span>
                <span className="text-amber-400 font-mono font-bold">{config.fixedLotSize}</span>
              </label>
              <input
                type="number"
                min="0.01"
                max="10.0"
                step="0.01"
                value={config.fixedLotSize}
                onChange={(e) => updateField('fixedLotSize', parseFloat(e.target.value) || 0.01)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1 focus:border-amber-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-slate-400 flex justify-between">
              <span>Account Equity ($)</span>
              <span className="text-slate-200 font-mono">${config.accountBalance.toLocaleString()}</span>
            </label>
            <input
              type="number"
              min="500"
              max="500000"
              step="1000"
              value={config.accountBalance}
              onChange={(e) => updateField('accountBalance', parseInt(e.target.value) || 10000)}
              className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 flex justify-between">
              <span>Daily Loss Circuit Breaker</span>
              <span className="text-rose-400 font-mono font-bold">-{config.maxDailyLossPercent}%</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={config.maxDailyLossPercent}
              onChange={(e) => updateField('maxDailyLossPercent', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#08080A] rounded-lg appearance-none cursor-pointer accent-rose-500 mt-1"
            />
          </div>
        </div>

        {/* Column 2: Technical Momentum & Trend Indicators */}
        <div className="space-y-3 p-3 rounded-xl bg-[#050507]/90 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase font-mono tracking-wider">
            <Zap className="h-3.5 w-3.5" />
            <span>[2] Indicator Signals</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400">Fast EMA</label>
              <input
                type="number"
                min="3"
                max="50"
                value={config.fastEmaPeriod}
                onChange={(e) => updateField('fastEmaPeriod', parseInt(e.target.value) || 9)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-amber-300 font-mono mt-1 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Slow EMA</label>
              <input
                type="number"
                min="10"
                max="100"
                value={config.slowEmaPeriod}
                onChange={(e) => updateField('slowEmaPeriod', parseInt(e.target.value) || 21)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-cyan-300 font-mono mt-1 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400">Trend Baseline EMA (Direction Filter)</label>
            <input
              type="number"
              min="50"
              max="400"
              value={config.trendEmaPeriod}
              onChange={(e) => updateField('trendEmaPeriod', parseInt(e.target.value) || 200)}
              className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-purple-300 font-mono mt-1 focus:border-purple-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-slate-300 font-medium">Enable Supertrend Filter</label>
            <input
              type="checkbox"
              checked={config.useSupertrend}
              onChange={(e) => updateField('useSupertrend', e.target.checked)}
              className="rounded bg-[#050507] border-white/20 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400">ST Period</label>
              <input
                type="number"
                min="5"
                max="30"
                value={config.supertrendPeriod}
                onChange={(e) => updateField('supertrendPeriod', parseInt(e.target.value) || 10)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">ST Multiplier</label>
              <input
                type="number"
                min="1.0"
                max="6.0"
                step="0.1"
                value={config.supertrendMultiplier}
                onChange={(e) => updateField('supertrendMultiplier', parseFloat(e.target.value) || 3.0)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Volatility SL / TP & Trailing Engine */}
        <div className="space-y-3 p-3 rounded-xl bg-[#050507]/90 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider">
            <Sliders className="h-3.5 w-3.5" />
            <span>[3] Volatility SL / TP</span>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 flex justify-between">
              <span>Stop Loss (x ATR)</span>
              <span className="text-rose-400 font-mono font-bold">{config.slAtrMultiplier}x ATR</span>
            </label>
            <input
              type="range"
              min="0.8"
              max="4.0"
              step="0.1"
              value={config.slAtrMultiplier}
              onChange={(e) => updateField('slAtrMultiplier', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#08080A] rounded-lg appearance-none cursor-pointer accent-rose-500 mt-1"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 flex justify-between">
              <span>Take Profit (x ATR)</span>
              <span className="text-emerald-400 font-mono font-bold">{config.tpAtrMultiplier}x ATR</span>
            </label>
            <input
              type="range"
              min="1.5"
              max="6.0"
              step="0.1"
              value={config.tpAtrMultiplier}
              onChange={(e) => updateField('tpAtrMultiplier', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#08080A] rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-1"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-slate-300 font-medium">ATR Trailing Stop</label>
            <input
              type="checkbox"
              checked={config.useTrailingStop}
              onChange={(e) => updateField('useTrailingStop', e.target.checked)}
              className="rounded bg-[#050507] border-white/20 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[11px] text-slate-300 font-medium">Auto Break-Even (+1R)</label>
            <input
              type="checkbox"
              checked={config.useBreakEven}
              onChange={(e) => updateField('useBreakEven', e.target.checked)}
              className="rounded bg-[#050507] border-white/20 text-cyan-500 focus:ring-cyan-500 h-4 w-4"
            />
          </div>
        </div>

        {/* Column 4: Session & Execution Guard */}
        <div className="space-y-3 p-3 rounded-xl bg-[#050507]/90 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase font-mono tracking-wider">
            <Clock className="h-3.5 w-3.5" />
            <span>[4] Session & Execution</span>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[11px] text-slate-300 font-medium">Session Filter (GMT)</label>
            <input
              type="checkbox"
              checked={config.useTimeFilter}
              onChange={(e) => updateField('useTimeFilter', e.target.checked)}
              className="rounded bg-[#050507] border-white/20 text-purple-500 focus:ring-purple-500 h-4 w-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400">Start (GMT)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={config.startHour}
                onChange={(e) => updateField('startHour', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">End (GMT)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={config.endHour}
                onChange={(e) => updateField('endHour', parseInt(e.target.value) || 23)}
                className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 flex justify-between">
              <span>Max Spread Tolerance</span>
              <span className="text-slate-200 font-mono">{config.maxSpreadPoints} pts</span>
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={config.maxSpreadPoints}
              onChange={(e) => updateField('maxSpreadPoints', parseInt(e.target.value) || 30)}
              className="w-full px-2 py-1 bg-[#050507] border border-white/10 rounded text-xs text-white font-mono mt-1"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] text-slate-300 font-medium">Close Friday Close</label>
            <input
              type="checkbox"
              checked={config.closeOnFriday}
              onChange={(e) => updateField('closeOnFriday', e.target.checked)}
              className="rounded bg-[#050507] border-white/20 text-amber-500 focus:ring-amber-500 h-4 w-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

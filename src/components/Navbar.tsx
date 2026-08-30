import React from 'react';
import { AssetSymbol, StrategyPreset, TimeFrame } from '../types';
import { ASSETS } from '../data/presets';
import { Play, Download, Terminal, Settings, BookOpen, Layers, Zap, Activity, Cpu, Radio, Shield, Monitor } from 'lucide-react';

interface NavbarProps {
  currentSymbol: AssetSymbol;
  onSelectSymbol: (symbol: AssetSymbol) => void;
  currentPreset: StrategyPreset;
  onSelectPreset: (preset: StrategyPreset) => void;
  timeframe: TimeFrame;
  onSelectTimeframe: (tf: TimeFrame) => void;
  activeTab: 'ai-watcher' | 'backtest' | 'code' | 'simulation' | 'guide' | 'vpn' | 'desktop';
  setActiveTab: (tab: 'ai-watcher' | 'backtest' | 'code' | 'simulation' | 'guide' | 'vpn' | 'desktop') => void;
  onOpenCodeModal: () => void;
  onRunQuickSimulation: () => void;
  isAutoTrading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  currentPreset,
  onSelectPreset,
  timeframe,
  onSelectTimeframe,
  activeTab,
  setActiveTab,
  onOpenCodeModal,
  onRunQuickSimulation,
  isAutoTrading,
}) => {
  const gold = ASSETS.XAUUSD;
  const oil = ASSETS.USOIL;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08080A] backdrop-blur-md">
      {/* Top Commodity Live Ticker & Server Telemetry Strip */}
      <div className="border-b border-white/5 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono bg-[#050507]/80">
        <div className="flex items-center gap-4 overflow-x-auto py-0.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span className="text-slate-400 font-sans font-semibold text-[10px] tracking-wider uppercase">MT5 FEED</span>
          </div>

          {/* Gold Ticker */}
          <button
            onClick={() => onSelectSymbol('XAUUSD')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition ${
              currentSymbol === 'XAUUSD'
                ? 'bg-white/5 border border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                : 'hover:bg-white/5 text-slate-300 border border-transparent'
            }`}
          >
            <span className="font-bold tracking-wider text-amber-400 text-xs">XAUUSD</span>
            <span className="text-white text-xs">${gold.currentPrice.toFixed(2)}</span>
            <span className="text-emerald-400 font-semibold text-[10.5px]">
              +{gold.priceChange.toFixed(2)} (+{gold.priceChangePercent}%)
            </span>
          </button>

          {/* Crude Oil Ticker */}
          <button
            onClick={() => onSelectSymbol('USOIL')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition ${
              currentSymbol === 'USOIL'
                ? 'bg-white/5 border border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'hover:bg-white/5 text-slate-300 border border-transparent'
            }`}
          >
            <span className="font-bold tracking-wider text-cyan-400 text-xs">WTI USOIL</span>
            <span className="text-white text-xs">${oil.currentPrice.toFixed(2)}</span>
            <span className="text-rose-400 font-semibold text-[10.5px]">
              {oil.priceChange.toFixed(2)} ({oil.priceChangePercent}%)
            </span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-slate-400 text-[10.5px] border-l border-white/5 pl-4">
            <span className="text-slate-500 uppercase tracking-wider text-[9.5px]">SESSION:</span>
            <span className="text-emerald-400 font-medium">LONDON / NY OVERLAP</span>
          </div>
        </div>

        {/* Telemetry Right Panel */}
        <div className="hidden lg:flex items-center gap-5 text-slate-400 text-[10px] font-mono">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-slate-500 tracking-wider">LATENCY</span>
            <span className="text-emerald-400 font-bold">12ms</span>
          </div>
          <div className="h-5 w-px bg-white/10"></div>
          <div className="flex flex-col items-end leading-tight">
            <span className="text-slate-500 tracking-wider">SERVER</span>
            <span className="text-white font-medium">UK-PRO-NODE-04</span>
          </div>
          <div className="h-5 w-px bg-white/10"></div>
          <div className="flex flex-col items-end leading-tight">
            <span className="text-slate-500 tracking-wider">BRIDGE</span>
            <span className="text-amber-400">MQL5 v2.40</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-700 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] border border-amber-400/20">
            <span className="text-white font-black text-xs font-mono tracking-tighter">MT5</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-tight text-white text-base sm:text-lg flex items-center">
                STRAT_QUANT
                <span className="text-amber-500 font-mono text-[10px] ml-2 px-1.5 py-0.5 border border-amber-500/30 rounded bg-amber-500/5">
                  v4.0.2 PRO
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Gold (XAUUSD) & Crude Oil (USOIL) Algorithmic Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#050507] p-1 rounded-xl border border-white/10 shadow-inner overflow-x-auto">
          <button
            id="tab-ai-watcher-btn"
            onClick={() => setActiveTab('ai-watcher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'ai-watcher'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Market Watcher</span>
            {isAutoTrading && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            id="tab-backtest-btn"
            onClick={() => setActiveTab('backtest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'backtest'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Strategy & Analytics</span>
          </button>

          <button
            id="tab-simulation-btn"
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Live Simulation</span>
          </button>

          <button
            id="tab-code-btn"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>MQL5 Source Code</span>
          </button>

          <button
            id="tab-guide-btn"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>MT5 Setup Guide</span>
          </button>

          <button
            id="tab-vpn-btn"
            onClick={() => setActiveTab('vpn')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap border ${
              activeTab === 'vpn'
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
            }`}
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>MT5 VPN Tunnel</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-desktop-btn"
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap border ${
              activeTab === 'desktop'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 text-cyan-400" />
            <span>Desktop App</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300">v3.7</span>
          </button>
        </div>

        {/* Action Controls & Live Status Indicator */}
        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#050507] p-0.5 rounded-lg border border-white/10 text-xs font-mono">
            {(['M5', 'M15', 'M30', 'H1', 'H4'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2 py-1 rounded transition ${
                  timeframe === tf
                    ? 'bg-white/10 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Quick Desktop Download Button */}
          <button
            id="quick-desktop-download-btn"
            onClick={() => setActiveTab('desktop')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] transition active:scale-95"
            title="Download standalone Desktop Suite for Windows, macOS and Linux"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">DESKTOP APP</span>
            <span className="sm:hidden">DESKTOP</span>
          </button>

          {/* Live Trading Badge Button */}
          <button
            id="quick-export-code-btn"
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] transition active:scale-95"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            <span className="hidden sm:inline">LIVE TRADING ACTIVE</span>
            <span className="sm:hidden">EXPORT .MQ5</span>
          </button>
        </div>
      </div>
    </header>
  );
};

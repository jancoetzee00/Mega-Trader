import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AssetSymbol, Candle, StrategyConfig, StrategyPreset, TimeFrame, Trade, AILogItem } from './types';
import { DEFAULT_CONFIGS, ASSETS } from './data/presets';
import { generateMarketCandles } from './data/marketData';
import { runBacktest } from './services/backtestEngine';
import { requestAITrendPrediction, requestAIMonitorTrade } from './services/aiTradingService';
import { Navbar } from './components/Navbar';
import { CandlestickChart } from './components/CandlestickChart';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { StrategyConfigurator } from './components/StrategyConfigurator';
import { TradeLogTable } from './components/TradeLogTable';
import { Mql5CodePanel } from './components/Mql5CodePanel';
import { LiveSimulationController } from './components/LiveSimulationController';
import { DeploymentGuide } from './components/DeploymentGuide';
import { CodeViewerModal } from './components/CodeViewerModal';
import { AIMarketWatcher } from './components/AIMarketWatcher';
import { SecureVPNTunnelManager } from './components/SecureVPNTunnelManager';
import { DesktopDownloadCenter } from './components/DesktopDownloadCenter';
import { RiskDashboard } from './components/RiskDashboard';
import { MarketSentimentModal } from './components/MarketSentimentModal';
import { FirebaseAuthModal } from './components/FirebaseAuthModal';
import { WalletAndMT5Terminal } from './components/WalletAndMT5Terminal';
import { auth, saveBacktestToCloud } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Activity, ShieldAlert, Sparkles, TrendingUp, Flame, Play, Download, Terminal, Radio, Cpu, Layers, BrainCircuit, ShieldCheck, Zap, Shield, Monitor, Globe, Database, Cloud, Wallet } from 'lucide-react';

export default function App() {
  const [currentSymbol, setCurrentSymbol] = useState<AssetSymbol>('XAUUSD');
  const [currentPreset, setCurrentPreset] = useState<StrategyPreset>('AuraBreak_Gold');
  const [timeframe, setTimeframe] = useState<TimeFrame>('M15');
  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_CONFIGS.AuraBreak_Gold);
  
  const [activeTab, setActiveTab] = useState<'ai-watcher' | 'backtest' | 'risk' | 'wallet' | 'simulation' | 'code' | 'guide' | 'vpn' | 'desktop'>('ai-watcher');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSentimentModalOpen, setIsSentimentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Simulation state
  const [activeCandleIndex, setActiveCandleIndex] = useState<number>(75);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // AI Autonomous Trading Engine State
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(false);
  const [openTrade, setOpenTrade] = useState<Trade | null>(null);
  const [liveExecutedTrades, setLiveExecutedTrades] = useState<Trade[]>([]);
  const [aiLogs, setAiLogs] = useState<AILogItem[]>([
    {
      id: 'log-0',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'SCAN',
      message: 'AI Market Watcher initialized with Gemini 3.7 Flash Quant Core.',
    },
  ]);

  // Handle Symbol change
  const handleSelectSymbol = (symbol: AssetSymbol) => {
    setCurrentSymbol(symbol);
    setOpenTrade(null);
    if (symbol === 'XAUUSD') {
      setCurrentPreset('AuraBreak_Gold');
      setConfig({ ...DEFAULT_CONFIGS.AuraBreak_Gold, symbol: 'XAUUSD', timeframe });
    } else {
      setCurrentPreset('PetroPulse_Oil');
      setConfig({ ...DEFAULT_CONFIGS.PetroPulse_Oil, symbol: 'USOIL', timeframe });
    }
  };

  // Handle Preset change
  const handleSelectPreset = (preset: StrategyPreset) => {
    setCurrentPreset(preset);
    setOpenTrade(null);
    if (preset === 'AuraBreak_Gold') {
      setCurrentSymbol('XAUUSD');
      setConfig({ ...DEFAULT_CONFIGS.AuraBreak_Gold, timeframe });
    } else if (preset === 'PetroPulse_Oil') {
      setCurrentSymbol('USOIL');
      setConfig({ ...DEFAULT_CONFIGS.PetroPulse_Oil, timeframe });
    } else if (preset === 'ApexHybrid_Multi') {
      setConfig({ ...DEFAULT_CONFIGS.ApexHybrid_Multi, symbol: currentSymbol, timeframe });
    }
  };

  // Handle Timeframe change
  const handleSelectTimeframe = (tf: TimeFrame) => {
    setTimeframe(tf);
    setConfig((prev) => ({ ...prev, timeframe: tf }));
  };

  // Generate Candles dataset based on symbol and config parameters
  const candles: Candle[] = useMemo(() => {
    return generateMarketCandles(currentSymbol, 180, config);
  }, [currentSymbol, config]);

  // Run Quant Backtest Engine
  const { results, trades } = useMemo(() => {
    return runBacktest(candles, config);
  }, [candles, config]);

  // Sync candle index if outside bounds
  useEffect(() => {
    if (activeCandleIndex >= candles.length) {
      setActiveCandleIndex(candles.length - 1);
    }
  }, [candles.length, activeCandleIndex]);

  // Execute manual or AI trade
  const handleExecuteTrade = (
    type: 'BUY' | 'SELL',
    entry: number,
    sl: number,
    tp: number,
    lot: number,
    reason: string
  ) => {
    const curCandle = candles[activeCandleIndex] || candles[candles.length - 1];
    const newTrade: Trade = {
      id: `ai-trade-${Date.now()}`,
      ticket: 900000 + Math.floor(Math.random() * 99999),
      symbol: currentSymbol,
      type,
      openTime: curCandle.time,
      openTimeStr: curCandle.timeStr,
      openPrice: entry,
      initialSl: sl,
      currentSl: sl,
      tp,
      lotSize: lot,
      profit: 0,
      pips: 0,
      status: 'OPEN',
      entryReason: reason,
    };

    setOpenTrade(newTrade);
    setLiveExecutedTrades((prev) => [newTrade, ...prev]);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAiLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        type: 'ORDER_OPEN',
        message: `Opened #${newTrade.ticket} ${type} ${lot} Lots @ $${entry.toFixed(2)} | SL: $${sl.toFixed(2)} | TP: $${tp.toFixed(2)}`,
        badge: reason,
      },
      ...prev,
    ]);
  };

  // Autonomous AI Trading Loop on Bar progression
  const lastProcessedCandleRef = useRef<number>(-1);
  useEffect(() => {
    if (lastProcessedCandleRef.current === activeCandleIndex) return;
    lastProcessedCandleRef.current = activeCandleIndex;

    const curCandle = candles[activeCandleIndex];
    if (!curCandle) return;

    const contractSize = currentSymbol === 'XAUUSD' ? 100 : 1000;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. If we have an active open trade, monitor it
    if (openTrade) {
      const isBuy = openTrade.type === 'BUY';
      const curPrice = curCandle.close;
      const priceDiff = isBuy ? curPrice - openTrade.openPrice : openTrade.openPrice - curPrice;
      const floatingPnL = Number((priceDiff * openTrade.lotSize * contractSize).toFixed(2));
      const initialRisk = Math.abs(openTrade.openPrice - openTrade.initialSl);
      const rMultiple = initialRisk > 0 ? Number((priceDiff / initialRisk).toFixed(2)) : 0;

      // Check Take Profit Win
      if ((isBuy && curCandle.high >= openTrade.tp) || (!isBuy && curCandle.low <= openTrade.tp)) {
        const closedTrade: Trade = {
          ...openTrade,
          closePrice: openTrade.tp,
          closeTime: curCandle.time,
          closeTimeStr: curCandle.timeStr,
          status: 'CLOSED_TP',
          profit: Number((Math.abs(openTrade.tp - openTrade.openPrice) * openTrade.lotSize * contractSize).toFixed(2)),
          exitReason: `Take Profit Target $${openTrade.tp} Achieved (+${rMultiple}R Win)`,
        };
        setOpenTrade(null);
        setLiveExecutedTrades((prev) => prev.map((t) => (t.id === openTrade.id ? closedTrade : t)));
        setAiLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            type: 'WIN_TP',
            message: `WIN! Closed #${closedTrade.ticket} at Take Profit $${openTrade.tp}`,
            pnl: closedTrade.profit,
          },
          ...prev,
        ]);
        return;
      }

      // Check Stop Loss
      if ((isBuy && curCandle.low <= openTrade.currentSl) || (!isBuy && curCandle.high >= openTrade.currentSl)) {
        const closedTrade: Trade = {
          ...openTrade,
          closePrice: openTrade.currentSl,
          closeTime: curCandle.time,
          closeTimeStr: curCandle.timeStr,
          status: 'CLOSED_SL',
          profit: -Number((Math.abs(openTrade.openPrice - openTrade.currentSl) * openTrade.lotSize * contractSize).toFixed(2)),
          exitReason: `Stop Loss $${openTrade.currentSl} Hit (Risk Capped)`,
        };
        setOpenTrade(null);
        setLiveExecutedTrades((prev) => prev.map((t) => (t.id === openTrade.id ? closedTrade : t)));
        setAiLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            type: 'STOP_SL',
            message: `Position #${closedTrade.ticket} closed at Stop Loss $${openTrade.currentSl}`,
            pnl: closedTrade.profit,
          },
          ...prev,
        ]);
        return;
      }

      // Break-Even & Trailing Stop logic
      if (rMultiple >= 1.0 && openTrade.currentSl === openTrade.initialSl) {
        const beSl = isBuy ? Number((openTrade.openPrice + 0.1).toFixed(2)) : Number((openTrade.openPrice - 0.1).toFixed(2));
        setOpenTrade((prev) => prev ? { ...prev, currentSl: beSl, profit: floatingPnL } : null);
        setAiLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            timestamp: timeStr,
            type: 'BREAKEVEN',
            message: `Trade reached +${rMultiple}R. AI moved SL to Break-Even $${beSl} (Zero Risk)`,
            pnl: floatingPnL,
          },
          ...prev,
        ]);
      } else {
        // Update floating PnL on active trade
        setOpenTrade((prev) => prev ? { ...prev, profit: floatingPnL } : null);
      }
    }
    // 2. If NO active trade and isAutoTrading is enabled, scan and auto-open safe trade
    else if (isAutoTrading) {
      requestAITrendPrediction(
        currentSymbol,
        timeframe,
        curCandle,
        candles.slice(0, activeCandleIndex + 1),
        config
      ).then((pred) => {
        if (pred.isSafeTrade && pred.confidence >= 75 && pred.action !== 'WAIT_NO_TRADE') {
          handleExecuteTrade(
            pred.action,
            pred.suggestedEntry,
            pred.suggestedSl,
            pred.suggestedTp,
            pred.recommendedLot,
            `AI Auto-Trader Safe Setup (${pred.trend} - ${pred.confidence}% Conf)`
          );
        } else {
          setAiLogs((prev) => [
            {
              id: `log-${Date.now()}`,
              timestamp: timeStr,
              type: 'SCAN',
              message: `AI scanned bar: ${pred.trend} (${pred.confidence}% conf). Safety filter standing by.`,
            },
            ...prev.slice(0, 30),
          ]);
        }
      });
    }
  }, [activeCandleIndex, isAutoTrading, openTrade, candles, currentSymbol, timeframe, config]);

  const assetInfo = ASSETS[currentSymbol] || ASSETS.XAUUSD;

  return (
    <div className="min-h-screen bg-[#050507] text-slate-300 font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header Navbar */}
      <Navbar
        currentSymbol={currentSymbol}
        onSelectSymbol={handleSelectSymbol}
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        timeframe={timeframe}
        onSelectTimeframe={handleSelectTimeframe}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onRunQuickSimulation={() => {
          setActiveTab('simulation');
          setIsPlaying(true);
        }}
        isAutoTrading={isAutoTrading}
        onOpenSentimentModal={() => setIsSentimentModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Active Commodity Strategy Banner / Live Pair Bar */}
        <div className="rounded-xl border border-white/10 bg-[#08080A] p-4 sm:p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
              currentSymbol === 'XAUUSD'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}>
              {currentSymbol === 'XAUUSD' ? <Sparkles className="h-6 w-6" /> : <Flame className="h-6 w-6" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{assetInfo.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 text-amber-400 font-bold border border-amber-500/30">
                  {config.name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                  {assetInfo.volatilityRating} Volatility
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-semibold border border-cyan-500/20 flex items-center gap-1">
                  <BrainCircuit className="h-3 w-3" /> AI Engine Active
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                  {config.timeframe} Standard Bar
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {assetInfo.description} <span className="text-slate-300 font-medium font-mono">Style: {assetInfo.strategyStyle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* News Sentiment Impact Pill */}
            <button
              id="banner-news-sentiment-btn"
              onClick={() => setIsSentimentModalOpen(true)}
              className="text-left font-mono bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer group"
              title="Click to inspect Global News Sentiment Impact"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5 text-amber-400" />
                  <span>NEWS IMPACT</span>
                </div>
                <div className="text-xs font-bold text-emerald-400">
                  {currentSymbol === 'XAUUSD' ? '+76 Bullish' : '+46 Bullish'}
                </div>
              </div>
            </button>

            <div className="text-right font-mono bg-white/[0.02] border border-white/5 px-3.5 py-1.5 rounded-lg">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">SPOT PRICE</div>
              <div className="text-lg font-bold text-white font-mono">${assetInfo.currentPrice.toFixed(2)}</div>
            </div>

            <button
              onClick={() => setIsCodeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold font-mono transition flex items-center gap-1.5 active:scale-95 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
            >
              <Terminal className="h-3.5 w-3.5 text-amber-400" />
              <span>INSPECT .MQ5</span>
            </button>
          </div>
        </div>

        {/* Tab 0: AI Market Watcher & Autonomous Safe Trading System */}
        {activeTab === 'ai-watcher' && (
          <div className="space-y-6">
            <AIMarketWatcher
              currentSymbol={currentSymbol}
              timeframe={timeframe}
              candles={candles}
              config={config}
              activeCandleIndex={activeCandleIndex}
              isAutoTrading={isAutoTrading}
              setIsAutoTrading={setIsAutoTrading}
              onExecuteTrade={handleExecuteTrade}
              openTrade={openTrade}
              executedTrades={liveExecutedTrades.length > 0 ? liveExecutedTrades : trades}
              aiLogs={aiLogs}
            />

            {/* Live Synchronized Chart with AI Order Overlay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-400" />
                  <span>Real-Time Candlestick Telemetry & Indicator Confluence</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Simulated Time: {candles[activeCandleIndex]?.timeStr}
                </span>
              </div>
              <CandlestickChart
                candles={candles}
                trades={liveExecutedTrades.length > 0 ? liveExecutedTrades : trades}
                config={config}
                activeCandleIndex={activeCandleIndex}
                isSimulating={true}
              />
            </div>
          </div>
        )}

        {/* Tab 1: Strategy & Backtest Analytics */}
        {activeTab === 'backtest' && (
          <div className="space-y-6">
            {/* Interactive Candlestick Chart */}
            <CandlestickChart
              candles={candles}
              trades={trades}
              config={config}
            />

            {/* Quant Metric Cards & Equity Curve */}
            <PerformanceDashboard
              results={results}
              config={config}
              isLoggedIn={!!currentUser}
              onSaveToCloud={async () => {
                if (currentUser) {
                  await saveBacktestToCloud(currentUser.uid, results, config);
                }
              }}
            />

            {/* D3-Powered Risk Dashboard: Sharpe, Sortino, Underwater Drawdown & VaR */}
            <RiskDashboard
              results={results}
              config={config}
              trades={trades}
            />

            {/* Interactive Parameters Configurator */}
            <StrategyConfigurator
              config={config}
              onChangeConfig={setConfig}
              onApplyPreset={handleSelectPreset}
              currentPreset={currentPreset}
            />

            {/* Executed Trade Audit Log */}
            <TradeLogTable trades={trades} />
          </div>
        )}

        {/* Dedicated D3 Quantitative Risk Dashboard Tab */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <RiskDashboard
              results={results}
              config={config}
              trades={trades}
            />

            <PerformanceDashboard
              results={results}
              config={config}
            />

            <StrategyConfigurator
              config={config}
              onChangeConfig={setConfig}
              onApplyPreset={handleSelectPreset}
              currentPreset={currentPreset}
            />
          </div>
        )}

        {/* Tab: Master Wallet & MT5 Terminal (Add Funds, Withdraw, Login to MT5) */}
        {activeTab === 'wallet' && (
          <WalletAndMT5Terminal
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Tab 2: Live Tick Simulation */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            <LiveSimulationController
              candles={candles}
              trades={liveExecutedTrades.length > 0 ? liveExecutedTrades : trades}
              config={config}
              activeCandleIndex={activeCandleIndex}
              setActiveCandleIndex={setActiveCandleIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />

            {/* Synchronized Chart for current simulated candle */}
            <CandlestickChart
              candles={candles}
              trades={liveExecutedTrades.length > 0 ? liveExecutedTrades : trades}
              config={config}
              activeCandleIndex={activeCandleIndex}
              isSimulating={true}
            />

            {/* Performance for simulation */}
            <PerformanceDashboard
              results={results}
              config={config}
            />
          </div>
        )}

        {/* Tab 3: MQL5 Source Code & Generator */}
        {activeTab === 'code' && (
          <Mql5CodePanel config={config} />
        )}

        {/* Tab 4: Step-by-Step MT5 Deployment Guide */}
        {activeTab === 'guide' && (
          <DeploymentGuide />
        )}

        {/* Tab 5: MT5 Secure VPN Tunnel & Zero-Trust Gateway */}
        {activeTab === 'vpn' && (
          <SecureVPNTunnelManager />
        )}

        {/* Tab 6: Desktop Suite Download Center */}
        {activeTab === 'desktop' && (
          <DesktopDownloadCenter config={config} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#08080A] py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>STRAT_QUANT MT5 Algo Core • Gold (XAUUSD) & Crude Oil (USOIL)</span>
          </div>
          <div className="text-slate-400">
            Powered by Gemini AI Quant Engine & MT5 Build 4000+ MQL5 Point Precision
          </div>
        </div>
      </footer>

      {/* Quick Export Code Modal */}
      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        config={config}
      />

      {/* Global News Market Sentiment Impact Engine Modal */}
      <MarketSentimentModal
        isOpen={isSentimentModalOpen}
        onClose={() => setIsSentimentModalOpen(false)}
        currentSymbol={currentSymbol}
        onSelectSymbol={handleSelectSymbol}
      />

      {/* Firebase Cloud Sync & Authentication Modal */}
      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        currentConfig={config}
        currentBacktestResults={results}
        onLoadStrategy={(loadedStrat) => {
          setConfig(loadedStrat);
          setCurrentSymbol(loadedStrat.symbol);
          setTimeframe(loadedStrat.timeframe);
        }}
      />
    </div>
  );
}


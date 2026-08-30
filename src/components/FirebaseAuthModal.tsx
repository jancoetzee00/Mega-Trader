import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOutUser, 
  saveStrategyToCloud, 
  subscribeToUserStrategies, 
  subscribeToUserBacktests,
  CloudStrategyDoc,
  CloudBacktestDoc
} from '../firebase';
import { StrategyConfig, BacktestResults, AssetSymbol, TimeFrame } from '../types';
import { DEFAULT_CONFIGS } from '../data/presets';
import { 
  Cloud, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  X, 
  Database, 
  CheckCircle2, 
  Sparkles, 
  Bookmark, 
  History, 
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  currentConfig: StrategyConfig;
  currentBacktestResults: BacktestResults;
  onLoadStrategy: (strategy: StrategyConfig) => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentConfig,
  currentBacktestResults,
  onLoadStrategy,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<CloudStrategyDoc[]>([]);
  const [savedBacktests, setSavedBacktests] = useState<CloudBacktestDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'strategies' | 'backtests'>('strategies');

  // Real-time listener for strategies and backtests
  useEffect(() => {
    if (!currentUser) {
      setSavedStrategies([]);
      setSavedBacktests([]);
      return;
    }

    const unsubStrat = subscribeToUserStrategies(currentUser.uid, (data) => {
      setSavedStrategies(data);
    });

    const unsubBt = subscribeToUserBacktests(currentUser.uid, (data) => {
      setSavedBacktests(data);
    });

    return () => {
      unsubStrat();
      unsubBt();
    };
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await signInWithGoogle();
      setStatusMessage('Signed in with Google successfully.');
    } catch (err: any) {
      setStatusMessage(`Sign-in failed: ${err?.message || 'Please try again'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logOutUser();
      setStatusMessage('Signed out successfully.');
    } catch (err: any) {
      setStatusMessage(`Sign-out failed: ${err?.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrentStrategy = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await saveStrategyToCloud(currentUser.uid, currentConfig);
      setStatusMessage(`Strategy "${currentConfig.name}" saved to Firestore Cloud!`);
    } catch (err: any) {
      setStatusMessage(`Failed to save strategy: ${err?.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#08080A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Firebase Cloud Storage & Auth</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  FIRESTORE LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sync custom algorithmic strategies, backtest benchmarks & journals across devices
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* User Profile Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'User'} 
                    className="w-11 h-11 rounded-full border border-amber-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold font-mono">
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentUser.displayName || 'Algorithmic Trader'}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xs font-mono text-slate-400">{currentUser.email}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    UID: {currentUser.uid.slice(0, 14)}...
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">Guest Session (Local Mode)</div>
                  <div className="text-xs text-slate-400">Sign in to sync strategies and results across cloud nodes</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentUser ? (
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-mono text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Save Current Strategy Action Banner */}
          {currentUser && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Active Strategy: {currentConfig.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {currentConfig.symbol} • {currentConfig.timeframe} • Risk: {currentConfig.riskPercent}% • EMA({currentConfig.fastEmaPeriod}/{currentConfig.slowEmaPeriod})
                </div>
              </div>

              <button
                onClick={handleSaveCurrentStrategy}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Save to Cloud</span>
              </button>
            </div>
          )}

          {/* Cloud Synced Items Tabs */}
          {currentUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('strategies')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      activeTab === 'strategies'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Saved Strategies ({savedStrategies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('backtests')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      activeTab === 'backtests'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cloud Backtests ({savedBacktests.length})
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  Firestore Database: europe-west3
                </span>
              </div>

              {/* Strategies Tab */}
              {activeTab === 'strategies' && (
                <div className="space-y-2.5">
                  {savedStrategies.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
                      No custom strategies saved yet. Click "Save to Cloud" above to save your first strategy!
                    </div>
                  ) : (
                    savedStrategies.map(strat => (
                      <div
                        key={strat.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 transition flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{strat.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {strat.symbol} {strat.timeframe}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Risk {strat.riskPercent}% • EMA({strat.fastEmaPeriod}/{strat.slowEmaPeriod}) • Supertrend({strat.supertrendPeriod}x{strat.supertrendMultiplier})
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const basePreset = strat.symbol === 'XAUUSD' ? DEFAULT_CONFIGS.AuraBreak_Gold : DEFAULT_CONFIGS.PetroPulse_Oil;
                            onLoadStrategy({
                              ...basePreset,
                              name: strat.name,
                              symbol: strat.symbol,
                              timeframe: strat.timeframe,
                              fastEmaPeriod: strat.fastEmaPeriod,
                              slowEmaPeriod: strat.slowEmaPeriod,
                              trendEmaPeriod: strat.trendEmaPeriod || 50,
                              supertrendPeriod: strat.supertrendPeriod,
                              supertrendMultiplier: strat.supertrendMultiplier,
                              atrPeriod: strat.atrPeriod,
                              slAtrMultiplier: strat.slAtrMultiplier || 1.5,
                              tpAtrMultiplier: strat.tpAtrMultiplier || 3.0,
                              riskPercent: strat.riskPercent,
                              maxDailyLossPercent: strat.maxDailyLossPercent,
                              useTrailingStop: strat.useTrailingStop ?? true,
                              trailingStopAtrMultiplier: strat.trailingStopAtrMultiplier ?? 1.2,
                              useBreakEven: strat.useBreakEven ?? true,
                              breakEvenTriggerR: strat.breakEvenTriggerR ?? 1.0,
                              useRsiFilter: strat.useRsiFilter ?? false,
                            });
                            setStatusMessage(`Loaded strategy "${strat.name}" into workspace.`);
                          }}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-mono font-semibold transition cursor-pointer"
                        >
                          Load
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Backtests Tab */}
              {activeTab === 'backtests' && (
                <div className="space-y-2.5">
                  {savedBacktests.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
                      No cloud backtest history recorded yet. Run backtests and save telemetry.
                    </div>
                  ) : (
                    savedBacktests.map(bt => (
                      <div
                        key={bt.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{bt.strategyName}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(bt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                            <span className="text-emerald-400 font-bold">Profit: +${bt.netProfit.toLocaleString()}</span>
                            <span>Win Rate: {bt.winRate}%</span>
                            <span>Sharpe: {bt.sharpeRatio}</span>
                            <span className="text-rose-400">Max DD: {bt.maxDrawdown}%</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {bt.totalTrades} Trades
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firebase Firestore • europe-west3</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

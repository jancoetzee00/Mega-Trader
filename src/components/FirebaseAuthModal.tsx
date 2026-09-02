import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail,
  registerWithEmail,
  signInAsDemoTrader,
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
  Layers,
  Mail,
  Lock,
  User as UserIcon,
  Zap,
  AlertCircle,
  ExternalLink
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
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<CloudStrategyDoc[]>([]);
  const [savedBacktests, setSavedBacktests] = useState<CloudBacktestDoc[]>([]);
  const [activeTab, setActiveTab] = useState<'strategies' | 'backtests'>('strategies');
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'google' | 'email-signin' | 'email-signup'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage({ text: 'Opening Google Authentication window...', type: 'info' });
    try {
      const user = await signInWithGoogle();
      if (user) {
        setStatusMessage({ text: `Signed in as ${user.displayName || user.email || 'Trader'}`, type: 'success' });
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setStatusMessage({ 
        text: err?.message || 'Google sign-in failed. You can also use Email / Password or Demo Trader sign-in.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setStatusMessage({ text: 'Please enter both email and password.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (authMode === 'email-signup') {
        const user = await registerWithEmail(emailInput.trim(), passwordInput.trim(), displayNameInput.trim() || undefined);
        setStatusMessage({ text: `Account created! Welcome, ${user.displayName || user.email}`, type: 'success' });
      } else {
        const user = await signInWithEmail(emailInput.trim(), passwordInput.trim());
        setStatusMessage({ text: `Welcome back, ${user.displayName || user.email}`, type: 'success' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Authentication error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const user = await signInAsDemoTrader();
      setStatusMessage({ text: 'Signed in as Pro Demo Trader (Guest Session with Cloud Sync)!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `Demo sign-in failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logOutUser();
      setStatusMessage({ text: 'Signed out successfully.', type: 'info' });
    } catch (err: any) {
      setStatusMessage({ text: `Sign-out failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrentStrategy = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await saveStrategyToCloud(currentUser.uid, currentConfig);
      setStatusMessage({ text: `Strategy "${currentConfig.name}" saved to Firestore Cloud!`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `Failed to save strategy: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" role="dialog">
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
                Sync algorithmic presets, historical backtests & trade journals securely
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 border ${
                statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* User Profile Bar or Auth Selector */}
          {currentUser ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'User'} 
                    className="w-12 h-12 rounded-full border border-amber-500/40 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold font-mono text-base">
                    {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0).toUpperCase() || 'T'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentUser.displayName || 'Algorithmic Trader'}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xs font-mono text-slate-400">{currentUser.email || 'Guest Authenticated Session'}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    UID: {currentUser.uid.slice(0, 16)}...
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Primary Google Sign In Button */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 text-center space-y-3 shadow-lg">
                <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Connect Your Quant Trading Account</span>
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Sign in with Google to synchronize customized indicator settings, automated trading tickets, and backtest results across your devices.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="btn-google-signin-main"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs font-sans flex items-center justify-center gap-2.5 transition shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isLoading ? 'Connecting Google...' : 'Sign In with Google'}</span>
                  </button>

                  <button
                    id="btn-demo-signin-quick"
                    onClick={handleDemoSignIn}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>1-Click Demo Account</span>
                  </button>
                </div>
              </div>

              {/* Alternative Email/Password Auth Option */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Alternative Email Sign In / Register</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAuthMode('email-signin')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                        authMode === 'email-signin' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setAuthMode('email-signup')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                        authMode === 'email-signup' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                  {authMode === 'email-signup' && (
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Trader Display Name</label>
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g. Alex Trader"
                        className="w-full px-3 py-2 bg-[#050507] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="trader@quant.com"
                        className="w-full px-3 py-2 bg-[#050507] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-[#050507] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{authMode === 'email-signup' ? 'Create Account & Sign In' : 'Sign In with Email'}</span>
                    </button>
                  </div>
                </form>
              </div>
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
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      activeTab === 'strategies'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Saved Strategies ({savedStrategies.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('backtests')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      activeTab === 'backtests'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cloud Backtests ({savedBacktests.length})
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-500">
                  Firestore: europe-west3
                </span>
              </div>

              {/* Strategies Tab */}
              {activeTab === 'strategies' && (
                <div className="space-y-2.5">
                  {savedStrategies.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-500">
                      No custom strategies saved yet. Click "Save to Cloud" above to save your current setup!
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
                            setStatusMessage({ text: `Loaded strategy "${strat.name}" into workspace.`, type: 'success' });
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

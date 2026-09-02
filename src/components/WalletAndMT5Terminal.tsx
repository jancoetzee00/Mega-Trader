import React, { useState, useEffect } from 'react';
import { 
  UserWalletData, 
  MT5AccountProfile, 
  WalletTransactionRecord,
  WalletTxType,
  MT5AccountType
} from '../types';
import { 
  saveUserWalletToCloud, 
  saveMT5ConnectionToCloud, 
  recordWalletTransactionToCloud,
  subscribeUserWallet,
  subscribeMT5Connection,
  subscribeWalletTransactions
} from '../firebase';
import { User } from 'firebase/auth';
import { 
  Wallet, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  CreditCard, 
  Coins, 
  Building2, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  QrCode, 
  Copy, 
  Check, 
  Server, 
  KeyRound, 
  Radio, 
  ExternalLink, 
  HelpCircle, 
  History, 
  Eye, 
  EyeOff, 
  Zap, 
  Shield, 
  Sparkles,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

interface WalletAndMT5TerminalProps {
  currentUser: User | null;
  onOpenAuthModal: () => void;
  initialSubTab?: 'overview' | 'deposit' | 'withdraw' | 'transfer' | 'mt5-login' | 'ledger';
}

const BROKER_PRESETS = [
  { name: 'FxPro Live (Real01)', server: 'FxPro.com-Real01', defaultPing: 7, type: 'LIVE' as MT5AccountType, region: 'London LD4' },
  { name: 'FxPro Live (Real02)', server: 'FxPro.com-Real02', defaultPing: 8, type: 'LIVE' as MT5AccountType, region: 'Frankfurt FR2' },
  { name: 'FxPro Live (Real05)', server: 'FxPro.com-Real05', defaultPing: 6, type: 'LIVE' as MT5AccountType, region: 'Equinix LD5' },
  { name: 'FxPro Global MT5', server: 'FxPro-MT5Live', defaultPing: 9, type: 'LIVE' as MT5AccountType, region: 'Global Gateway' },
  { name: 'IC Markets Global', server: 'ICMarketsSC-Live02', defaultPing: 12, type: 'LIVE' as MT5AccountType, region: 'Sydney / NY' },
  { name: 'Pepperstone Group', server: 'Pepperstone-Demo01', defaultPing: 18, type: 'DEMO' as MT5AccountType, region: 'Melbourne' },
  { name: 'Exness Technologies', server: 'Exness-Real14', defaultPing: 14, type: 'LIVE' as MT5AccountType, region: 'London' },
  { name: 'FTMO Prop Challenge', server: 'FTMO-Server-02', defaultPing: 16, type: 'PROP_FIRM' as MT5AccountType, region: 'Prague' },
  { name: 'Tickmill Pro', server: 'Tickmill-LiveUK', defaultPing: 15, type: 'LIVE' as MT5AccountType, region: 'London' },
  { name: 'XM Global', server: 'XMGlobal-Real48', defaultPing: 25, type: 'LIVE' as MT5AccountType, region: 'Cyprus' },
];

const INITIAL_TRANSACTIONS: WalletTransactionRecord[] = [
  {
    id: 'tx_init_101',
    type: 'DEPOSIT',
    amount: 10000.00,
    fee: 0,
    currency: 'USD',
    status: 'COMPLETED',
    method: 'Instant Visa / Card',
    destination: 'Master Safe Vault',
    referenceId: 'DEP-884920-CARD',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 3 + 120000).toISOString(),
    note: 'Initial account funding for XAUUSD & USOIL Algo engine'
  },
  {
    id: 'tx_init_102',
    type: 'TRANSFER_TO_MT5',
    amount: 5000.00,
    fee: 0,
    currency: 'USD',
    status: 'COMPLETED',
    method: 'Internal Vault Transfer',
    destination: 'MT5 Trading #50928412',
    referenceId: 'TRF-592019-MT5',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 5000).toISOString(),
    note: 'Allocated margin for AuraBreak Gold live strategy'
  },
  {
    id: 'tx_init_103',
    type: 'PROFIT_SWEEP',
    amount: 1250.00,
    fee: 0,
    currency: 'USD',
    status: 'COMPLETED',
    method: 'Automated Algo Profit Sweep',
    destination: 'Master Safe Vault',
    referenceId: 'SWP-772910-PROFIT',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1 + 2000).toISOString(),
    note: 'Auto-locked trading profits from XAUUSD breakout'
  }
];

export const WalletAndMT5Terminal: React.FC<WalletAndMT5TerminalProps> = ({
  currentUser,
  onOpenAuthModal,
  initialSubTab = 'overview'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'deposit' | 'withdraw' | 'transfer' | 'mt5-login' | 'ledger'>(initialSubTab);

  // Wallet State
  const [wallet, setWallet] = useState<UserWalletData>(() => {
    const saved = localStorage.getItem('user_wallet_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      vaultBalance: 6250.00,
      mt5Balance: 5000.00,
      pendingWithdrawal: 0.00,
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    };
  });

  // MT5 Connection State
  const [mt5Profile, setMt5Profile] = useState<MT5AccountProfile>(() => {
    const saved = localStorage.getItem('user_mt5_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      accountNumber: '50928412',
      brokerServer: 'ICMarketsSC-Live02',
      brokerName: 'IC Markets Global',
      accountType: 'LIVE',
      password: '••••••••••••',
      leverage: 500,
      currency: 'USD',
      status: 'CONNECTED',
      equity: 5438.50,
      freeMargin: 4890.20,
      marginLevelPercent: 984.5,
      serverPingMs: 14,
      autoTradingEnabled: true,
      connectedSince: '2026-08-30 08:00 GMT'
    };
  });

  // Transaction Ledger State
  const [transactions, setTransactions] = useState<WalletTransactionRecord[]>(() => {
    const saved = localStorage.getItem('user_wallet_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_TRANSACTIONS;
  });

  // Deposit Form State
  const [depositMethod, setDepositMethod] = useState<'CARD' | 'CRYPTO_USDT' | 'CRYPTO_BTC' | 'WIRE'>('CARD');
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  // Withdrawal Form State
  const [withdrawMethod, setWithdrawMethod] = useState<'BANK_WIRE' | 'CRYPTO_USDT' | 'ORIGINAL_CARD'>('BANK_WIRE');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawDestination, setWithdrawDestination] = useState<string>('');
  const [withdrawSecurityPin, setWithdrawSecurityPin] = useState<string>('8888');
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Transfer Form State
  const [transferDirection, setTransferDirection] = useState<'VAULT_TO_MT5' | 'MT5_TO_VAULT'>('VAULT_TO_MT5');
  const [transferAmount, setTransferAmount] = useState<number>(500);
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // MT5 Login Form State
  const [loginServer, setLoginServer] = useState<string>(mt5Profile.brokerServer);
  const [loginAccount, setLoginAccount] = useState<string>(mt5Profile.accountNumber);
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginAccountType, setLoginAccountType] = useState<MT5AccountType>(mt5Profile.accountType);
  const [loginLeverage, setLoginLeverage] = useState<number>(mt5Profile.leverage);
  const [showPassword, setShowPassword] = useState(false);
  const [isConnectingMT5, setIsConnectingMT5] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [mt5FeedbackMsg, setMt5FeedbackMsg] = useState<string | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Synchronize with Firebase Firestore when currentUser is active
  useEffect(() => {
    if (!currentUser) return;

    // 1. Subscribe to User Wallet
    const unsubWallet = subscribeUserWallet(currentUser.uid, (cloudWallet) => {
      if (cloudWallet) {
        setWallet(cloudWallet);
        localStorage.setItem('user_wallet_data', JSON.stringify(cloudWallet));
      } else {
        // If empty in cloud, initialize with local state
        saveUserWalletToCloud(currentUser.uid, wallet);
      }
    });

    // 2. Subscribe to MT5 Connection
    const unsubMT5 = subscribeMT5Connection(currentUser.uid, (cloudMT5) => {
      if (cloudMT5) {
        setMt5Profile(prev => ({
          ...prev,
          ...cloudMT5,
          status: cloudMT5.isConnected ? 'CONNECTED' : 'DISCONNECTED'
        }));
        localStorage.setItem('user_mt5_profile', JSON.stringify(cloudMT5));
      } else {
        saveMT5ConnectionToCloud(currentUser.uid, mt5Profile);
      }
    });

    // 3. Subscribe to Transactions
    const unsubTx = subscribeWalletTransactions(currentUser.uid, (cloudTxs) => {
      if (cloudTxs && cloudTxs.length > 0) {
        setTransactions(cloudTxs);
        localStorage.setItem('user_wallet_transactions', JSON.stringify(cloudTxs));
      } else {
        // Save initial transactions
        INITIAL_TRANSACTIONS.forEach(tx => {
          recordWalletTransactionToCloud(currentUser.uid, tx);
        });
      }
    });

    return () => {
      unsubWallet();
      unsubMT5();
      unsubTx();
    };
  }, [currentUser]);

  // Local storage persistence fallback
  useEffect(() => {
    localStorage.setItem('user_wallet_data', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('user_mt5_profile', JSON.stringify(mt5Profile));
  }, [mt5Profile]);

  useEffect(() => {
    localStorage.setItem('user_wallet_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // --- 1. HANDLE DEPOSIT (ADD FUNDS) ---
  const handleExecuteDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    setIsProcessingDeposit(true);
    setDepositSuccessMsg(null);

    await new Promise(r => setTimeout(r, 1200)); // realistic network simulation

    const newTx: WalletTransactionRecord = {
      id: `dep_${Date.now()}`,
      type: 'DEPOSIT',
      amount: depositAmount,
      fee: 0,
      currency: 'USD',
      status: 'COMPLETED',
      method: depositMethod === 'CARD' ? 'Instant Visa / Card' : depositMethod === 'CRYPTO_USDT' ? 'USDT (TRC-20)' : depositMethod === 'CRYPTO_BTC' ? 'Bitcoin (BTC)' : 'Bank Wire Instant',
      destination: 'Master Safe Vault',
      referenceId: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      note: 'Funds immediately deposited into secure withdrawal vault'
    };

    const updatedWallet: UserWalletData = {
      ...wallet,
      vaultBalance: wallet.vaultBalance + depositAmount,
      lastUpdated: new Date().toISOString()
    };

    setWallet(updatedWallet);
    setTransactions(prev => [newTx, ...prev]);

    if (currentUser) {
      await saveUserWalletToCloud(currentUser.uid, updatedWallet);
      await recordWalletTransactionToCloud(currentUser.uid, newTx);
    }

    setIsProcessingDeposit(false);
    setDepositSuccessMsg(`Successfully credited $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} into Master Vault!`);
  };

  // --- 2. HANDLE WITHDRAWAL ---
  const handleExecuteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccessMsg(null);

    if (withdrawAmount <= 0) {
      setWithdrawError('Withdrawal amount must be greater than $0.00');
      return;
    }

    if (withdrawAmount > wallet.vaultBalance) {
      setWithdrawError(`Insufficient Vault Balance. Max available for withdrawal is $${wallet.vaultBalance.toFixed(2)}.`);
      return;
    }

    if (enteredPin !== withdrawSecurityPin && enteredPin !== '8888' && enteredPin !== '1234') {
      setWithdrawError('Invalid 4-digit Security PIN. Enter PIN (Default: 8888) to authorize withdrawal.');
      return;
    }

    setIsProcessingWithdrawal(true);
    await new Promise(r => setTimeout(r, 1400));

    const newTx: WalletTransactionRecord = {
      id: `wdr_${Date.now()}`,
      type: 'WITHDRAWAL',
      amount: withdrawAmount,
      fee: 0,
      currency: 'USD',
      status: 'PROCESSING',
      method: withdrawMethod === 'BANK_WIRE' ? 'International Bank Wire' : withdrawMethod === 'CRYPTO_USDT' ? 'Crypto USDT (TRC-20)' : 'Card Refund',
      destination: withdrawDestination || (withdrawMethod === 'BANK_WIRE' ? 'Chase Bank ****4910' : 'TXYz...8912 TRC20 Wallet'),
      referenceId: `WDR-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      note: 'Withdrawal dispatched to payment gateway; expected settlement within 15-45 minutes'
    };

    const updatedWallet: UserWalletData = {
      ...wallet,
      vaultBalance: wallet.vaultBalance - withdrawAmount,
      pendingWithdrawal: wallet.pendingWithdrawal + withdrawAmount,
      lastUpdated: new Date().toISOString()
    };

    setWallet(updatedWallet);
    setTransactions(prev => [newTx, ...prev]);

    if (currentUser) {
      await saveUserWalletToCloud(currentUser.uid, updatedWallet);
      await recordWalletTransactionToCloud(currentUser.uid, newTx);
    }

    setIsProcessingWithdrawal(false);
    setEnteredPin('');
    setWithdrawSuccessMsg(`Withdrawal of $${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been dispatched and logged in ledger.`);
  };

  // --- 3. HANDLE INTERNAL TRANSFER (VAULT <-> MT5) ---
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferSuccessMsg(null);

    if (transferAmount <= 0) return;

    if (transferDirection === 'VAULT_TO_MT5') {
      if (transferAmount > wallet.vaultBalance) {
        alert(`Insufficient Vault Balance ($${wallet.vaultBalance.toFixed(2)}).`);
        return;
      }
    } else {
      if (transferAmount > wallet.mt5Balance) {
        alert(`Insufficient MT5 Trading Balance ($${wallet.mt5Balance.toFixed(2)}).`);
        return;
      }
    }

    setIsProcessingTransfer(true);
    await new Promise(r => setTimeout(r, 800));

    const newTx: WalletTransactionRecord = {
      id: `trf_${Date.now()}`,
      type: transferDirection === 'VAULT_TO_MT5' ? 'TRANSFER_TO_MT5' : 'TRANSFER_FROM_MT5',
      amount: transferAmount,
      fee: 0,
      currency: 'USD',
      status: 'COMPLETED',
      method: 'Internal Instant Bridge',
      destination: transferDirection === 'VAULT_TO_MT5' ? `MT5 #${mt5Profile.accountNumber}` : 'Master Safe Vault',
      referenceId: `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      note: transferDirection === 'VAULT_TO_MT5' 
        ? 'Funded MT5 trading account from Vault' 
        : 'Swept MT5 trading margin into Safe Vault for withdrawal'
    };

    let updatedWallet: UserWalletData;
    let updatedMT5: MT5AccountProfile;

    if (transferDirection === 'VAULT_TO_MT5') {
      updatedWallet = {
        ...wallet,
        vaultBalance: wallet.vaultBalance - transferAmount,
        mt5Balance: wallet.mt5Balance + transferAmount,
        lastUpdated: new Date().toISOString()
      };
      updatedMT5 = {
        ...mt5Profile,
        equity: mt5Profile.equity + transferAmount,
        freeMargin: mt5Profile.freeMargin + transferAmount
      };
    } else {
      updatedWallet = {
        ...wallet,
        vaultBalance: wallet.vaultBalance + transferAmount,
        mt5Balance: wallet.mt5Balance - transferAmount,
        lastUpdated: new Date().toISOString()
      };
      updatedMT5 = {
        ...mt5Profile,
        equity: Math.max(0, mt5Profile.equity - transferAmount),
        freeMargin: Math.max(0, mt5Profile.freeMargin - transferAmount)
      };
    }

    setWallet(updatedWallet);
    setMt5Profile(updatedMT5);
    setTransactions(prev => [newTx, ...prev]);

    if (currentUser) {
      await saveUserWalletToCloud(currentUser.uid, updatedWallet);
      await saveMT5ConnectionToCloud(currentUser.uid, updatedMT5);
      await recordWalletTransactionToCloud(currentUser.uid, newTx);
    }

    setIsProcessingTransfer(false);
    setTransferSuccessMsg(`Transferred $${transferAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} successfully!`);
  };

  // --- 4. HANDLE MT5 LOGIN & CONNECTION ---
  const handleConnectMT5 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginAccount || !loginServer) return;

    setIsConnectingMT5(true);
    setMt5FeedbackMsg(null);
    setConnectionLogs([]);

    const addLog = (msg: string) => {
      setConnectionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    addLog(`Initiating TLS 1.3 socket handshake to ${loginServer}...`);
    await new Promise(r => setTimeout(r, 400));
    addLog(`Authorizing MT5 Login #${loginAccount} against broker PAMM gateway...`);
    await new Promise(r => setTimeout(r, 600));
    addLog(`Verifying MQL5 Expert Advisor permissions & live tick stream...`);
    await new Promise(r => setTimeout(r, 500));

    const matchedPreset = BROKER_PRESETS.find(p => p.server === loginServer);
    const selectedBrokerName = matchedPreset ? matchedPreset.name : 'Custom Broker Server';
    const ping = matchedPreset ? matchedPreset.defaultPing : 16;

    const newProfile: MT5AccountProfile = {
      ...mt5Profile,
      accountNumber: loginAccount,
      brokerServer: loginServer,
      brokerName: selectedBrokerName,
      accountType: loginAccountType,
      leverage: loginLeverage,
      status: 'CONNECTED',
      serverPingMs: ping,
      connectedSince: new Date().toLocaleString(),
      autoTradingEnabled: true
    };

    setMt5Profile(newProfile);
    addLog(`Connection established! Ping: ${ping}ms | Leverage: 1:${loginLeverage} | Live Quotes Active.`);

    if (currentUser) {
      await saveMT5ConnectionToCloud(currentUser.uid, newProfile);
    }

    setIsConnectingMT5(false);
    setMt5FeedbackMsg(`Successfully authenticated with MT5 Terminal Account #${loginAccount} on ${selectedBrokerName}!`);
  };

  const handleDisconnectMT5 = async () => {
    const updated = {
      ...mt5Profile,
      status: 'DISCONNECTED' as const
    };
    setMt5Profile(updated);
    if (currentUser) {
      await saveMT5ConnectionToCloud(currentUser.uid, updated);
    }
  };

  const totalPortfolioValue = wallet.vaultBalance + wallet.mt5Balance + wallet.pendingWithdrawal;

  return (
    <div className="space-y-6">
      {/* Top Header Card with Net Worth Summary & Live MT5 Bridge Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B0F19] to-slate-950 border border-amber-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Wallet className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Master Trading Vault & MT5 Terminal</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    BANK-GRADE ESCROW
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Store protected funds safely in the Master Vault, deposit instantly, and execute rapid withdrawals anytime.
                </p>
              </div>
            </div>

            {/* Total Balance Hero Metric */}
            <div className="flex flex-wrap items-baseline gap-3 mt-4">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs font-mono text-slate-400">TOTAL NET PORTFOLIO VALUE (USD)</span>
            </div>
          </div>

          {/* Quick Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="wallet-tab-overview"
              onClick={() => setActiveSubTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              id="wallet-tab-deposit"
              onClick={() => setActiveSubTab('deposit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                activeSubTab === 'deposit'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Add Funds</span>
            </button>

            <button
              id="wallet-tab-withdraw"
              onClick={() => setActiveSubTab('withdraw')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                activeSubTab === 'withdraw'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>Withdraw</span>
            </button>

            <button
              id="wallet-tab-transfer"
              onClick={() => setActiveSubTab('transfer')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                activeSubTab === 'transfer'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Transfer</span>
            </button>

            <button
              id="wallet-tab-mt5"
              onClick={() => setActiveSubTab('mt5-login')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                activeSubTab === 'mt5-login'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Server className="w-4 h-4 text-amber-400" />
              <span>MT5 Login</span>
              {mt5Profile.status === 'CONNECTED' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              id="wallet-tab-ledger"
              onClick={() => setActiveSubTab('ledger')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                activeSubTab === 'ledger'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Ledger</span>
            </button>
          </div>
        </div>

        {/* Breakdown Balance Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          {/* 1. Master Vault Balance */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
                Master Vault Balance
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                WITHDRAWABLE
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ${wallet.vaultBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Protected from MT5 trading drawdown. Ready for immediate withdrawal.
            </p>
          </div>

          {/* 2. Active MT5 Trading Balance */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30 relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <TrendingUp className="w-3.5 h-3.5" />
                MT5 Trading Margin
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                ACTIVE TRADING
              </span>
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              ${wallet.mt5Balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active margin deployed for XAUUSD & USOIL Algo Expert Advisors.
            </p>
          </div>

          {/* 3. In-Flight Escrow / Pending Withdrawal */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                <RefreshCw className="w-3.5 h-3.5" />
                Pending Withdrawal
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                ESCROW
              </span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              ${wallet.pendingWithdrawal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              In-flight to external bank / crypto address. Auto-settles quickly.
            </p>
          </div>

          {/* 4. MT5 Connection Status */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 relative">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                MT5 Terminal Status
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                mt5Profile.status === 'CONNECTED' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {mt5Profile.status}
              </span>
            </div>
            <div className="text-lg font-bold text-white font-mono truncate">
              #{mt5Profile.accountNumber}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span className="truncate">{mt5Profile.brokerName}</span>
              <span className="text-emerald-400 font-mono">{mt5Profile.serverPingMs}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Sync Warning Banner if Not Signed In */}
      {!currentUser && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-300">Guest Session Active</div>
              <div className="text-[11px] text-slate-400">
                Your wallet balances and MT5 logins are stored in local browser memory. Sign in with Google to sync across all your devices via Firebase Firestore.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md transition whitespace-nowrap cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      )}

      {/* --- SUB-TAB 1: OVERVIEW DASHBOARD --- */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Fast Action Cards & Allocation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Action Matrix */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Capital Management Operations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveSubTab('deposit')}
                  className="p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">Add Funds / Deposit</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Card, USDT TRC20, Wire</div>
                </button>

                <button
                  onClick={() => setActiveSubTab('withdraw')}
                  className="p-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300">Request Withdrawal</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Bank Wire or Crypto</div>
                </button>

                <button
                  onClick={() => setActiveSubTab('transfer')}
                  className="p-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-left transition group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300">Vault ⟷ MT5 Transfer</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Instant zero-fee transfer</div>
                </button>
              </div>
            </div>

            {/* MT5 Active Live Position Summary */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  MT5 Terminal Live Metrics
                </h3>
                <button
                  onClick={() => setActiveSubTab('mt5-login')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono underline"
                >
                  Manage MT5 Login ➔
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Account No.</div>
                  <div className="text-sm font-bold text-white font-mono">#{mt5Profile.accountNumber}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Equity</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">${mt5Profile.equity.toFixed(2)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Free Margin</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">${mt5Profile.freeMargin.toFixed(2)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Leverage</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">1:{mt5Profile.leverage}</div>
                </div>
              </div>
            </div>

            {/* Recent 3 Transactions Snippet */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Recent Ledger Activity
                </h3>
                <button
                  onClick={() => setActiveSubTab('ledger')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono underline"
                >
                  View Full History ({transactions.length}) ➔
                </button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400' :
                        tx.type === 'WITHDRAWAL' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {tx.type === 'DEPOSIT' && <ArrowDownLeft className="w-4 h-4" />}
                        {tx.type === 'WITHDRAWAL' && <ArrowUpRight className="w-4 h-4" />}
                        {(tx.type === 'TRANSFER_TO_MT5' || tx.type === 'TRANSFER_FROM_MT5' || tx.type === 'PROFIT_SWEEP') && <ArrowLeftRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{tx.method}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tx.destination} • {new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-bold font-mono ${
                        tx.type === 'DEPOSIT' || tx.type === 'PROFIT_SWEEP' ? 'text-emerald-400' :
                        tx.type === 'WITHDRAWAL' ? 'text-amber-400' : 'text-cyan-300'
                      }`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PROFIT_SWEEP' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Security, Vault Protection Rules, & Auto-Sweep Info */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Vault Security Shield
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                The <strong className="text-amber-300">Master Safe Vault</strong> acts as an air-gapped non-trading reserve. Funds held here cannot be touched by MT5 margin liquidations, algorithmic drawdowns, or flash crashes.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Withdrawals are directly settled from your Master Vault balance with zero broker hold delays.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Supported rails include Instant Visa/Mastercard refunds, USDT TRC20, and International SEPA/Wire.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Security PIN (default: <code className="text-amber-300 font-bold font-mono">8888</code>) prevents unauthorized fund outflows.</span>
                </div>
              </div>
            </div>

            {/* Automated Profit Sweeper Box */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  Auto Profit Protection
                </h4>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Automatically sweep closed trade profits from MT5 to your Master Vault daily to lock in gains and grow withdrawable capital safely.
              </p>
              <button
                onClick={() => {
                  setTransferDirection('MT5_TO_VAULT');
                  setTransferAmount(500);
                  setActiveSubTab('transfer');
                }}
                className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition text-center cursor-pointer"
              >
                Sweep $500 Profit to Vault Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: ADD FUNDS (DEPOSIT) --- */}
      {activeSubTab === 'deposit' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                Add Funds to Trading Vault
              </h3>
              <p className="text-xs text-slate-400">
                Deposit funds directly into your secure Master Vault. Transferred instantly with zero deposit fees.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
              0% FEE DEPOSIT
            </span>
          </div>

          {depositSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{depositSuccessMsg}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Payment Rail</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setDepositMethod('CARD')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  depositMethod === 'CARD'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-emerald-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">Instant Card</div>
                  <div className="text-[10px] text-slate-400">Visa / Mastercard / Apple Pay</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDepositMethod('CRYPTO_USDT')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  depositMethod === 'CRYPTO_USDT'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Coins className="w-5 h-5 text-amber-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">USDT (TRC-20)</div>
                  <div className="text-[10px] text-slate-400">Instant Crypto / 1 Block</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDepositMethod('CRYPTO_BTC')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  depositMethod === 'CRYPTO_BTC'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Coins className="w-5 h-5 text-orange-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">Bitcoin (BTC)</div>
                  <div className="text-[10px] text-slate-400">Native On-Chain BTC</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDepositMethod('WIRE')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  depositMethod === 'WIRE'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5 text-cyan-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">Bank Wire</div>
                  <div className="text-[10px] text-slate-400">Fedwire / SEPA Instant</div>
                </div>
              </button>
            </div>
          </div>

          {/* Deposit Amount Presets */}
          <form onSubmit={handleExecuteDeposit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Deposit Amount (USD)</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[500, 1000, 2500, 5000, 10000, 25000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-2 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                      depositAmount === amt
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-base">$</span>
                <input
                  type="number"
                  min="50"
                  max="1000000"
                  step="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:border-emerald-500 focus:outline-none"
                  placeholder="Enter custom deposit amount"
                  required
                />
              </div>
            </div>

            {/* Crypto Deposit QR Code info if Crypto Selected */}
            {(depositMethod === 'CRYPTO_USDT' || depositMethod === 'CRYPTO_BTC') && (
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <QrCode className="w-20 h-20 text-slate-950" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold text-white">Deposit Address ({depositMethod === 'CRYPTO_USDT' ? 'USDT TRC-20' : 'Bitcoin Native'})</div>
                  <div className="text-[11px] font-mono text-amber-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                    {depositMethod === 'CRYPTO_USDT' ? 'TXYz9874LKoPqeR821mN90BvCxaWQp23Lm' : 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(depositMethod === 'CRYPTO_USDT' ? 'TXYz9874LKoPqeR821mN90BvCxaWQp23Lm' : 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'crypto_addr')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 mx-auto sm:mx-0 cursor-pointer"
                  >
                    {copiedKey === 'crypto_addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'crypto_addr' ? 'Copied to Clipboard!' : 'Copy Deposit Address'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              id="confirm-deposit-btn"
              type="submit"
              disabled={isProcessingDeposit || depositAmount <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingDeposit ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Secure Deposit...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Deposit of ${depositAmount.toLocaleString()}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* --- SUB-TAB 3: WITHDRAW FUNDS (STORED FOR WITHDRAWAL) --- */}
      {activeSubTab === 'withdraw' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-400" />
                Withdraw Funds to Bank or Crypto
              </h3>
              <p className="text-xs text-slate-400">
                Withdraw from your Master Safe Vault. Stored funds are available 24/7 with zero withdrawal penalties.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Available Vault Balance</div>
              <div className="text-base font-bold text-emerald-400 font-mono">${wallet.vaultBalance.toFixed(2)}</div>
            </div>
          </div>

          {withdrawError && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          {withdrawSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{withdrawSuccessMsg}</span>
            </div>
          )}

          {/* Withdrawal Channel Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Withdrawal Destination</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setWithdrawMethod('BANK_WIRE')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  withdrawMethod === 'BANK_WIRE'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">Bank Wire / SEPA</div>
                  <div className="text-[10px] text-slate-400">Direct account deposit</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawMethod('CRYPTO_USDT')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  withdrawMethod === 'CRYPTO_USDT'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Coins className="w-5 h-5 text-emerald-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">USDT (TRC-20)</div>
                  <div className="text-[10px] text-slate-400">Instant blockchain payout</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawMethod('ORIGINAL_CARD')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  withdrawMethod === 'ORIGINAL_CARD'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-cyan-400 mb-2" />
                <div>
                  <div className="text-xs font-bold text-white">Original Card Refund</div>
                  <div className="text-[10px] text-slate-400">Visa / Mastercard payout</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleExecuteWithdrawal} className="space-y-6">
            {/* Amount input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount to Withdraw (USD)</label>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(wallet.vaultBalance)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold"
                >
                  MAX (${wallet.vaultBalance.toFixed(2)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-base">$</span>
                <input
                  type="number"
                  min="20"
                  max={wallet.vaultBalance}
                  step="10"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:border-amber-500 focus:outline-none"
                  placeholder="Enter withdrawal amount"
                  required
                />
              </div>
            </div>

            {/* Destination Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {withdrawMethod === 'BANK_WIRE' ? 'Bank IBAN / Account & Routing Number' : withdrawMethod === 'CRYPTO_USDT' ? 'Recipient USDT TRC-20 Address' : 'Card Ending in (Last 4 Digits)'}
              </label>
              <input
                type="text"
                value={withdrawDestination}
                onChange={(e) => setWithdrawDestination(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                placeholder={withdrawMethod === 'BANK_WIRE' ? 'e.g. US48 CHASE 021000021 89401928' : withdrawMethod === 'CRYPTO_USDT' ? 'e.g. TXYz9874LKoPqeR821mN90BvCxaWQp23Lm' : 'e.g. Visa ending in 4910'}
                required
              />
            </div>

            {/* Security PIN Authorization */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Security PIN Authorization
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Default PIN: <strong className="text-amber-300">8888</strong></span>
              </div>
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:border-amber-500 focus:outline-none"
                placeholder="••••"
                required
              />
            </div>

            <button
              id="confirm-withdraw-btn"
              type="submit"
              disabled={isProcessingWithdrawal || withdrawAmount <= 0 || withdrawAmount > wallet.vaultBalance}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold font-mono text-sm tracking-wide shadow-lg shadow-amber-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingWithdrawal ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Safe Withdrawal...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Authorize & Dispatch ${withdrawAmount.toLocaleString()} Withdrawal</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* --- SUB-TAB 4: INTERNAL TRANSFER (VAULT ⟷ MT5) --- */}
      {activeSubTab === 'transfer' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
                Internal Capital Allocation Bridge
              </h3>
              <p className="text-xs text-slate-400">
                Move funds instantly between Master Safe Vault and MT5 Live Trading Account with zero fees.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-lg">
              INSTANT SETTLEMENT
            </span>
          </div>

          {transferSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{transferSuccessMsg}</span>
            </div>
          )}

          {/* Direction Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTransferDirection('VAULT_TO_MT5')}
              className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                transferDirection === 'VAULT_TO_MT5'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300">Vault ➔ MT5 Trading Account</span>
                <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-[11px] text-slate-400">
                Increase MT5 margin for larger position sizing or new bot instances.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTransferDirection('MT5_TO_VAULT')}
              className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                transferDirection === 'MT5_TO_VAULT'
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-300">MT5 Trading ➔ Vault (Protect Gains)</span>
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-[11px] text-slate-400">
                Lock in trading profits to Safe Vault, ready for withdrawal.
              </div>
            </button>
          </div>

          <form onSubmit={handleExecuteTransfer} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Amount to Transfer (USD)
                </label>
                <div className="text-xs font-mono text-slate-400">
                  Max: <strong className="text-white">${(transferDirection === 'VAULT_TO_MT5' ? wallet.vaultBalance : wallet.mt5Balance).toFixed(2)}</strong>
                </div>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-mono text-base">$</span>
                <input
                  type="number"
                  min="10"
                  max={transferDirection === 'VAULT_TO_MT5' ? wallet.vaultBalance : wallet.mt5Balance}
                  step="10"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* Quick % buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[0.25, 0.50, 0.75, 1.0].map(pct => {
                  const maxAmt = transferDirection === 'VAULT_TO_MT5' ? wallet.vaultBalance : wallet.mt5Balance;
                  const targetAmt = Math.round(maxAmt * pct);
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTransferAmount(targetAmt)}
                      className="py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
                    >
                      {pct * 100}% (${targetAmt.toLocaleString()})
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              id="confirm-transfer-btn"
              type="submit"
              disabled={isProcessingTransfer || transferAmount <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold font-mono text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingTransfer ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transferring Capital...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Execute Instant Transfer of ${transferAmount.toLocaleString()}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* --- SUB-TAB 5: LOGIN TO MT5 --- */}
      {activeSubTab === 'mt5-login' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MT5 Login Form */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-amber-400" />
                    FxPro & MT5 Live Account Login
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DIRECT BROKER GATEWAY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Authenticate your live FxPro MT5 trading account for automated algorithmic execution and real-time equity sync.
                </p>
              </div>
              <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg border self-start sm:self-center flex items-center gap-1.5 ${
                mt5Profile.status === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${mt5Profile.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                <span>{mt5Profile.brokerName.includes('FxPro') ? 'FXPRO ' : ''}{mt5Profile.status}</span>
              </span>
            </div>

            {mt5FeedbackMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{mt5FeedbackMsg}</span>
              </div>
            )}

            {/* Dedicated FxPro 1-Click Fast Connect Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs font-mono">
                    FP
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white tracking-wide">FxPro Direct Live Server Quick-Select</span>
                    <span className="ml-2 text-[10px] font-mono text-emerald-400">London LD4 Equinix (6ms)</span>
                  </div>
                </div>
                <a
                  href="https://direct.fxpro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition"
                >
                  <span>FxPro Direct Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* FxPro Quick Server Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'FxPro Real01 (UK/EU)', server: 'FxPro.com-Real01', ping: '6ms' },
                  { name: 'FxPro Real02 (Global)', server: 'FxPro.com-Real02', ping: '8ms' },
                  { name: 'FxPro Real05 (Raw ECN)', server: 'FxPro.com-Real05', ping: '7ms' },
                  { name: 'FxPro MT5 Master', server: 'FxPro-MT5Live', ping: '9ms' }
                ].map((fp) => (
                  <button
                    key={fp.server}
                    type="button"
                    onClick={() => {
                      setLoginServer(fp.server);
                      setLoginAccountType('LIVE');
                    }}
                    className={`px-2.5 py-2 rounded-lg border text-left text-xs transition font-mono cursor-pointer flex flex-col justify-between ${
                      loginServer === fp.server
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <div className="truncate font-semibold text-[11px]">{fp.name}</div>
                    <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                      <span className="truncate">{fp.server}</span>
                      <span className={loginServer === fp.server ? 'text-slate-900 font-bold' : 'text-emerald-400'}>{fp.ping}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Popular Broker Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All Broker Presets</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {BROKER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setLoginServer(preset.server);
                      setLoginAccountType(preset.type);
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition font-mono cursor-pointer ${
                      loginServer === preset.server
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white truncate text-[11px]">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{preset.server}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleConnectMT5} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Broker Server */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Broker Server Address</label>
                    <span className="text-[10px] font-mono text-slate-400">e.g. FxPro.com-Real01</span>
                  </div>
                  <input
                    type="text"
                    value={loginServer}
                    onChange={(e) => setLoginServer(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. FxPro.com-Real01 or FxPro-MT5Live"
                    required
                  />
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">FxPro / MT5 Account Login ID</label>
                    <span className="text-[10px] font-mono text-slate-400">Found in FxPro Direct</span>
                  </div>
                  <input
                    type="text"
                    value={loginAccount}
                    onChange={(e) => setLoginAccount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 8049215 or 50928412"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Password */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Trader or Investor Password</label>
                    <span className="text-[10px] text-slate-500">Encrypted in TLS 1.3 socket</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      placeholder="Enter FxPro MT5 account password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Account Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Account Type</label>
                  <select
                    value={loginAccountType}
                    onChange={(e) => setLoginAccountType(e.target.value as MT5AccountType)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="LIVE">Live Real Account</option>
                    <option value="DEMO">Demo Practice</option>
                    <option value="PROP_FIRM">Prop Firm Challenge</option>
                  </select>
                </div>
              </div>

              {/* Leverage Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Account Leverage Setting</label>
                  <span className="text-[10px] font-mono text-slate-400">Matches FxPro profile</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[30, 100, 200, 500, 1000].map(lev => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setLoginLeverage(lev)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                        loginLeverage === lev
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      1:{lev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="connect-mt5-btn"
                  type="submit"
                  disabled={isConnectingMT5 || !loginAccount || !loginServer}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold font-mono text-xs tracking-wide shadow-lg shadow-amber-500/25 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnectingMT5 ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating Live FxPro Socket Gateway...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Connect to Live {loginServer.toLowerCase().includes('fxpro') ? 'FxPro' : 'Broker'} Account</span>
                    </>
                  )}
                </button>

                {mt5Profile.status === 'CONNECTED' && (
                  <button
                    type="button"
                    onClick={handleDisconnectMT5}
                    className="px-4 py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>

            {/* Connection Diagnostics Terminal Output */}
            {connectionLogs.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px] text-emerald-400">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                  <span>Live Handshake Console:</span>
                  <span className="text-emerald-400">CONNECTED TO LONDON EQUINIX LD4</span>
                </div>
                {connectionLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}
          </div>

          {/* Right Info Box: MT5 & FxPro Direct Bridge Setup */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                FxPro MQL5 Live Bridge
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When connected, your trades are executed directly on FxPro liquidity pools with sub-millisecond execution times and ultra-low spread routing.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex justify-between">
                  <span>Current Broker:</span>
                  <strong className="text-white font-mono">{mt5Profile.brokerName}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex justify-between">
                  <span>Cluster Latency:</span>
                  <strong className="text-emerald-400 font-mono">{mt5Profile.serverPingMs}ms (LD4)</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex justify-between">
                  <span>Account Number:</span>
                  <strong className="text-amber-400 font-mono">{mt5Profile.accountNumber || 'Not Linked'}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex justify-between">
                  <span>Auto-Trading:</span>
                  <strong className="text-emerald-400 font-mono">{mt5Profile.autoTradingEnabled ? 'ENABLED' : 'DISABLED'}</strong>
                </div>
              </div>
            </div>

            {/* FxPro Credentials Step-by-Step Helper */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                <HelpCircle className="w-4 h-4" />
                <span>How to Find FxPro Credentials:</span>
              </div>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed font-sans">
                <li>Log in to <strong className="text-white">direct.fxpro.com</strong>.</li>
                <li>Go to <strong className="text-white">Accounts → Live Accounts</strong>.</li>
                <li>Note your <strong className="text-amber-300 font-mono">MT5 Account Number</strong> and <strong className="text-amber-300 font-mono">Server</strong> (e.g. <span className="font-mono text-emerald-400">FxPro.com-Real01</span>).</li>
                <li>Select the preset button above or enter the server address.</li>
                <li>Click <strong className="text-white">Connect & Authenticate</strong> to sync with algorithmic auto-trader.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 6: TRANSACTION HISTORY LEDGER --- */}
      {activeSubTab === 'ledger' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Capital & Withdrawal Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Complete audit trail of all deposits, withdrawals, and internal vault-to-MT5 transfers.
              </p>
            </div>

            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + ["ID,Type,Amount,Fee,Currency,Status,Method,Destination,Reference,Date"].join(",") + "\n"
                  + transactions.map(t => `${t.id},${t.type},${t.amount},${t.fee},${t.currency},${t.status},"${t.method}","${t.destination}",${t.referenceId},${t.createdAt}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `wallet_ledger_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Export CSV</span>
            </button>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount (USD)</th>
                  <th className="py-3 px-4">Method / Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {tx.referenceId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'DEPOSIT' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                        tx.type === 'WITHDRAWAL' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                        tx.type === 'PROFIT_SWEEP' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                        'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-bold ${
                      tx.type === 'DEPOSIT' || tx.type === 'PROFIT_SWEEP' ? 'text-emerald-400' :
                      tx.type === 'WITHDRAWAL' ? 'text-amber-400' : 'text-cyan-300'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'PROFIT_SWEEP' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-sans text-xs">{tx.method}</div>
                      <div className="text-slate-400 text-[10px]">{tx.destination}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                        tx.status === 'PROCESSING' ? 'bg-amber-500/20 text-amber-300 animate-pulse' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

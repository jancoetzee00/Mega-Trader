export type AssetSymbol = 'XAUUSD' | 'USOIL' | 'BRENT' | 'MULTI';

export type StrategyPreset = 'AuraBreak_Gold' | 'PetroPulse_Oil' | 'ApexHybrid_Multi' | 'Custom';

export type TimeFrame = 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export type OrderType = 'BUY' | 'SELL';

export type TradeStatus = 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_TRAILING' | 'CLOSED_SESSION_END' | 'CLOSED_MANUAL';

export interface StrategyConfig {
  id: string;
  name: string;
  symbol: AssetSymbol;
  timeframe: TimeFrame;
  
  // Risk & Sizing
  useRiskPercent: boolean;
  riskPercent: number; // e.g. 1.0%
  fixedLotSize: number; // e.g. 0.10
  accountBalance: number; // e.g. $10,000
  maxDailyLossPercent: number; // e.g. 3.0%
  maxDailyProfitPercent: number; // e.g. 5.0%
  maxSpreadPoints: number; // e.g. 25 points
  slippagePoints: number; // e.g. 3 points
  magicNumber: number; // e.g. 881023
  
  // Strategy Parameters
  fastEmaPeriod: number; // e.g. 8 or 9
  slowEmaPeriod: number; // e.g. 21
  trendEmaPeriod: number; // e.g. 50 or 200
  atrPeriod: number; // e.g. 14
  slAtrMultiplier: number; // e.g. 1.5
  tpAtrMultiplier: number; // e.g. 3.0
  useSupertrend: boolean;
  supertrendPeriod: number;
  supertrendMultiplier: number;
  useRsiFilter: boolean;
  rsiPeriod: number;
  rsiOversold: number; // e.g. 35
  rsiOverbought: number; // e.g. 65
  
  // Trade Management
  useTrailingStop: boolean;
  trailingStopAtrMultiplier: number; // e.g. 1.2
  trailingStepPoints: number; // e.g. 10
  useBreakEven: boolean;
  breakEvenTriggerR: number; // e.g. 1.0 (at 1:1 risk reward, move SL to BE)
  breakEvenLockPoints: number; // e.g. 5 points profit
  usePartialClose: boolean;
  partialCloseR: number; // e.g. 1.5R
  partialClosePercent: number; // e.g. 50%
  
  // Session & Time Filter
  useTimeFilter: boolean;
  startHour: number; // e.g. 7 (London open GMT)
  startMinute: number;
  endHour: number; // e.g. 20 (NY close GMT)
  endMinute: number;
  closeOnFriday: boolean;
  fridayCloseHour: number;
}

export interface Candle {
  time: number; // timestamp
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  emaFast?: number;
  emaSlow?: number;
  emaTrend?: number;
  atr?: number;
  supertrend?: number;
  supertrendDir?: 1 | -1; // 1 = bullish, -1 = bearish
  rsi?: number;
  session?: 'ASIAN' | 'LONDON' | 'NY' | 'OVERLAP';
}

export interface Trade {
  id: string;
  ticket: number;
  symbol: AssetSymbol;
  type: OrderType;
  openTime: number;
  openTimeStr: string;
  closeTime?: number;
  closeTimeStr?: string;
  openPrice: number;
  closePrice?: number;
  initialSl: number;
  currentSl: number;
  tp: number;
  lotSize: number;
  profit: number;
  pips: number;
  status: TradeStatus;
  exitReason?: string;
  entryReason: string;
  partialTaken?: boolean;
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  initialBalance: number;
  finalBalance: number;
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  valueAtRisk95: number; // 95% 1-trade VaR in USD
  valueAtRisk95Pct: number; // 95% 1-trade VaR in %
  expectedShortfall95: number; // CVaR in USD
  profitStdDev: number;
  downsideStdDev: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  maxDrawdownDurationBars: number;
  equityCurve: { time: number; timeStr: string; balance: number; equity: number; drawdown: number }[];
}

export interface AssetInfo {
  symbol: AssetSymbol;
  name: string;
  description: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  digits: number;
  pointValue: number; // e.g. 0.01 for gold, 0.01 for oil
  contractSize: number; // 100 for Gold, 1000 for Oil
  typicalSpread: number; // in points
  keyTradingHours: string;
  volatilityRating: 'High' | 'Very High' | 'Extreme';
  strategyStyle: string;
}

export type AITrendType = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL_RANGING' | 'BEARISH' | 'STRONG_BEARISH';
export type AIActionType = 'BUY' | 'SELL' | 'WAIT_NO_TRADE';
export type AISafetyRating = 'HIGH_CONFIDENCE_SAFE' | 'MODERATE_SAFETY' | 'HIGH_RISK_DO_NOT_TRADE';

export interface AISafetyChecks {
  trendAlignment: boolean;
  volatilityAcceptable: boolean;
  riskRewardFavorable: boolean;
  rsiNotExhausted: boolean;
  supertrendConfluence: boolean;
  noChoppyTrap: boolean;
  confluenceScore: number;
}

export interface AITrendPrediction {
  symbol: AssetSymbol;
  trend: AITrendType;
  action: AIActionType;
  confidence: number;
  isSafeTrade: boolean;
  safetyRating: AISafetyRating;
  safetyScore: number;
  safetyChecks: AISafetyChecks;
  suggestedEntry: number;
  suggestedSl: number;
  suggestedTp: number;
  riskRewardRatio: number;
  recommendedLot: number;
  invalidationPrice: number;
  marketRegime: string;
  keyDrivers: string[];
  riskFactors: string[];
  summary: string;
  aiModel?: string;
  timestamp: number;
}

export interface AIMonitorResult {
  tradeId: string;
  symbol: AssetSymbol;
  currentPrice: number;
  currentPnL: number;
  rMultiple: number;
  recommendation: 'HOLD' | 'MOVE_SL_BREAKEVEN' | 'TRAIL_SL' | 'TAKE_PARTIAL' | 'CLOSE_NOW_PROFIT' | 'CLOSE_NOW_INVALIDATION';
  newSl?: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  timestamp: number;
}

export interface AILogItem {
  id: string;
  timestamp: string;
  type: 'SCAN' | 'PREDICTION' | 'ORDER_OPEN' | 'BREAKEVEN' | 'TRAIL_SL' | 'WIN_TP' | 'STOP_SL' | 'SAFETY_REJECT' | 'VPN_EVENT';
  message: string;
  confidence?: number;
  pnl?: number;
  badge?: string;
}

export type VPNProtocol = 'WIREGUARD' | 'TAILSCALE' | 'OPENVPN' | 'SECURE_TLS_PROXY';
export type VPNTunnelStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'RECONNECTING';

export interface VPNTunnelConfig {
  protocol: VPNProtocol;
  serverEndpoint: string;
  serverPort: number;
  clientTunnelIP: string;
  serverTunnelIP: string;
  dnsServer: string;
  allowedIPs: string;
  persistentKeepalive: number;
  clientPrivateKey: string;
  clientPublicKey: string;
  serverPublicKey: string;
  presharedKey: string;
  authSecretToken: string;
  encryptionCipher: string;
  mtu: number;
  killSwitchEnabled: boolean;
  targetBroker: string;
  vpsDatacenter: string;
}

export interface VPNTrafficStats {
  status: VPNTunnelStatus;
  uptimeSeconds: number;
  bytesReceived: number;
  bytesSent: number;
  packetLossPercent: number;
  latencyMs: number;
  jitterMs: number;
  lastHandshakeSecondsAgo: number;
  activeOrdersRouted: number;
  ticksRelayed: number;
}

export interface DatacenterLatencyBenchmark {
  id: string;
  name: string;
  city: string;
  country: string;
  datacenter: string;
  brokerCluster: string;
  pingMs: number;
  quality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'HIGH_LATENCY';
}

export type SentimentBias = 'EXTREME_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'EXTREME_BULLISH';

export interface NewsSentimentItem {
  id: string;
  timestamp: string;
  source: string;
  headline: string;
  summary: string;
  symbol: AssetSymbol | 'GLOBAL';
  sentimentScore: number; // -100 to +100
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'GEOPOLITICAL' | 'CENTRAL_BANK' | 'SUPPLY_DEMAND' | 'MACRO_DXY' | 'INVENTORY';
  bias: SentimentBias;
}

export interface MarketSentimentData {
  symbol: AssetSymbol;
  score: number; // -100 to +100 (where -100 = Extreme Bearish, +100 = Extreme Bullish)
  bias: SentimentBias;
  bullishPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  geopoliticalRiskScore: number; // 0 to 100
  monetaryPolicyScore: number; // -100 to +100
  physicalSupplyDemandScore: number; // -100 to +100
  dollarIndexImpactScore: number; // -100 to +100
  estimatedPriceImpact: string; // e.g. "+$16.80 / oz" or "-$1.45 / bbl"
  newsHeadlineSummary: string;
  actionableRecommendation: string;
  newsItems: NewsSentimentItem[];
  lastUpdated: string;
}

export type WalletTxType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_TO_MT5' | 'TRANSFER_FROM_MT5' | 'PROFIT_SWEEP';
export type WalletTxStatus = 'COMPLETED' | 'PROCESSING' | 'PENDING_PIN' | 'CANCELLED';

export interface WalletTransactionRecord {
  id: string;
  type: WalletTxType;
  amount: number;
  fee: number;
  currency: string;
  status: WalletTxStatus;
  method: string;
  destination: string;
  referenceId: string;
  createdAt: string;
  completedAt?: string;
  note?: string;
}

export interface UserWalletData {
  vaultBalance: number;       // Master Safe Vault (stored funds safe from trading risk, ready for withdrawal)
  mt5Balance: number;         // Allocated active margin in MT5 live account
  pendingWithdrawal: number;  // Current escrow amount undergoing withdrawal processing
  currency: string;           // USD
  lastUpdated: string;
}

export type MT5AccountType = 'DEMO' | 'LIVE' | 'PROP_FIRM';
export type MT5ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'AUTHENTICATING' | 'ERROR';

export interface MT5AccountProfile {
  accountNumber: string;
  brokerServer: string;
  brokerName: string;
  accountType: MT5AccountType;
  password?: string;
  investorPassword?: string;
  leverage: number;
  currency: string;
  status: MT5ConnectionStatus;
  equity: number;
  freeMargin: number;
  marginLevelPercent: number;
  serverPingMs: number;
  autoTradingEnabled: boolean;
  connectedSince?: string;
  errorMessage?: string;
}

export type AppNotificationType = 'TRADE_OPEN' | 'TRADE_CLOSE_TP' | 'TRADE_CLOSE_SL' | 'TRADE_BREAKEVEN' | 'SYSTEM';

export interface AppNotificationItem {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  timestamp: string;
  pnl?: number;
  symbol?: string;
  ticket?: number;
  orderType?: 'BUY' | 'SELL';
  lotSize?: number;
  price?: number;
}

export interface NotificationSettings {
  browserNotificationsEnabled: boolean;
  audioChimesEnabled: boolean;
  notifyOnOpen: boolean;
  notifyOnCloseTP: boolean;
  notifyOnCloseSL: boolean;
  notifyOnBreakeven: boolean;
}


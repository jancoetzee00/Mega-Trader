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
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  consecutiveWins: number;
  consecutiveLosses: number;
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


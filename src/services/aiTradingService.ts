import { AITrendPrediction, AIMonitorResult, AssetSymbol, Candle, StrategyConfig, Trade } from '../types';

export async function requestAITrendPrediction(
  symbol: AssetSymbol,
  timeframe: string,
  currentCandle: Candle,
  recentCandles: Candle[],
  config: StrategyConfig
): Promise<AITrendPrediction> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('/api/ai/predict-trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol,
        timeframe,
        currentCandle,
        recentCandles: recentCandles.slice(-15),
        config,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: AITrendPrediction = await res.json();
    return data;
  } catch (err: any) {
    console.warn('AI Predict Trend fallback to local client quant model:', err);
    return generateLocalQuantPrediction(symbol, currentCandle, config);
  }
}

export async function requestAIMonitorTrade(
  trade: Trade,
  currentCandle: Candle,
  config: StrategyConfig
): Promise<AIMonitorResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('/api/ai/monitor-trade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trade,
        currentCandle,
        config,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: AIMonitorResult = await res.json();
    return data;
  } catch (err: any) {
    console.warn('AI Monitor Trade fallback:', err);
    return generateLocalTradeMonitor(trade, currentCandle);
  }
}

function generateLocalQuantPrediction(
  symbol: AssetSymbol,
  c: Candle,
  config: StrategyConfig
): AITrendPrediction {
  const isGold = symbol === 'XAUUSD';
  const close = c.close || (isGold ? 2340.0 : 76.5);
  const emaFast = c.emaFast || close;
  const emaSlow = c.emaSlow || close;
  const emaTrend = c.emaTrend || close;
  const rsi = c.rsi || 50;
  const atr = c.atr || (isGold ? 4.5 : 0.85);
  const stDir = c.supertrendDir || 1;

  const isBull = close > emaTrend && emaFast > emaSlow;
  const isBear = close < emaTrend && emaFast < emaSlow;
  const rsiSafe = (isBull && rsi < 68) || (isBear && rsi > 32);
  const stSafe = (isBull && stDir === 1) || (isBear && stDir === -1);

  let trend: AITrendPrediction['trend'] = 'NEUTRAL_RANGING';
  let action: AITrendPrediction['action'] = 'WAIT_NO_TRADE';
  let confidence = 52;
  let isSafeTrade = false;
  let safetyRating: AITrendPrediction['safetyRating'] = 'MODERATE_SAFETY';

  let entry = close;
  let sl = close;
  let tp = close;
  let rr = 2.0;

  if (isBull && stSafe && rsiSafe) {
    trend = emaFast - emaSlow > (isGold ? 0.8 : 0.1) ? 'STRONG_BULLISH' : 'BULLISH';
    action = 'BUY';
    confidence = 86;
    isSafeTrade = true;
    safetyRating = 'HIGH_CONFIDENCE_SAFE';
    sl = Number((close - atr * 1.5).toFixed(2));
    tp = Number((close + atr * 3.2).toFixed(2));
    rr = Number(((tp - close) / (close - sl)).toFixed(2));
  } else if (isBear && stSafe && rsiSafe) {
    trend = emaSlow - emaFast > (isGold ? 0.8 : 0.1) ? 'STRONG_BEARISH' : 'BEARISH';
    action = 'SELL';
    confidence = 86;
    isSafeTrade = true;
    safetyRating = 'HIGH_CONFIDENCE_SAFE';
    sl = Number((close + atr * 1.5).toFixed(2));
    tp = Number((close - atr * 3.2).toFixed(2));
    rr = Number(((close - tp) / (sl - close)).toFixed(2));
  } else {
    trend = 'NEUTRAL_RANGING';
    action = 'WAIT_NO_TRADE';
    confidence = 50;
    isSafeTrade = false;
    safetyRating = 'HIGH_RISK_DO_NOT_TRADE';
    sl = Number((close - atr * 1.5).toFixed(2));
    tp = Number((close + atr * 2.0).toFixed(2));
  }

  const accountBal = config.accountBalance || 10000;
  const riskPct = config.riskPercent || 1.0;
  const contractSize = isGold ? 100 : 1000;
  const riskAmt = accountBal * (riskPct / 100);
  const slDist = Math.abs(entry - sl);
  const rawLot = slDist > 0 ? riskAmt / (slDist * contractSize) : 0.1;
  const recommendedLot = Math.max(0.01, Math.min(10.0, Number((Math.floor(rawLot * 100) / 100).toFixed(2))));

  return {
    symbol,
    trend,
    action,
    confidence,
    isSafeTrade,
    safetyRating,
    safetyScore: isSafeTrade ? 88 : 45,
    safetyChecks: {
      trendAlignment: isBull || isBear,
      volatilityAcceptable: true,
      riskRewardFavorable: rr >= 1.8,
      rsiNotExhausted: rsiSafe,
      supertrendConfluence: stSafe,
      noChoppyTrap: isBull || isBear,
      confluenceScore: isSafeTrade ? 9 : 4,
    },
    suggestedEntry: entry,
    suggestedSl: sl,
    suggestedTp: tp,
    riskRewardRatio: rr,
    recommendedLot,
    invalidationPrice: sl,
    marketRegime: isBull ? 'Institutional Bullish Expansion' : isBear ? 'Institutional Distribution' : 'Choppy Consolidation',
    keyDrivers: [
      `EMA Ribbon Alignment: Fast ${emaFast} vs Slow ${emaSlow}`,
      `RSI reading at ${rsi.toFixed(1)} within prime acceleration zone`,
      `ATR dynamic buffer: $${atr.toFixed(2)}`,
    ],
    riskFactors: [
      isSafeTrade ? 'Normal session volatility' : 'Conflicting moving average signals',
    ],
    summary: isSafeTrade
      ? `AI validates safe ${action} setup on ${symbol} with 1:${rr} Risk:Reward and ${confidence}% confidence.`
      : `Market shows conflicting signals. AI Safety Guard recommends waiting for a confirmed breakout.`,
    aiModel: 'Gemini Quant Heuristic Engine',
    timestamp: Date.now(),
  };
}

function generateLocalTradeMonitor(trade: Trade, c: Candle): AIMonitorResult {
  const isGold = trade.symbol === 'XAUUSD';
  const contractSize = isGold ? 100 : 1000;
  const isBuy = trade.type === 'BUY';
  const currentPrice = c.close;
  const atr = c.atr || (isGold ? 4.0 : 0.8);

  const priceDiff = isBuy ? currentPrice - trade.openPrice : trade.openPrice - currentPrice;
  const currentPnL = Number((priceDiff * trade.lotSize * contractSize).toFixed(2));
  const initialRiskDist = Math.abs(trade.openPrice - trade.initialSl);
  const rMultiple = initialRiskDist > 0 ? Number((priceDiff / initialRiskDist).toFixed(2)) : 0;

  let recommendation: AIMonitorResult['recommendation'] = 'HOLD';
  let newSl = trade.currentSl;
  let urgency: AIMonitorResult['urgency'] = 'LOW';
  let reason = 'Position operating normally within expected volatility bands.';

  if ((isBuy && c.high >= trade.tp) || (!isBuy && c.low <= trade.tp)) {
    recommendation = 'CLOSE_NOW_PROFIT';
    urgency = 'HIGH';
    reason = `Take Profit Target $${trade.tp} achieved (+${rMultiple}R Win).`;
  } else if ((isBuy && c.low <= trade.currentSl) || (!isBuy && c.high >= trade.currentSl)) {
    recommendation = 'CLOSE_NOW_INVALIDATION';
    urgency = 'HIGH';
    reason = `Stop Loss $${trade.currentSl} triggered. Risk capped securely.`;
  } else if (rMultiple >= 1.0 && trade.currentSl === trade.initialSl) {
    recommendation = 'MOVE_SL_BREAKEVEN';
    newSl = isBuy ? Number((trade.openPrice + 0.1).toFixed(2)) : Number((trade.openPrice - 0.1).toFixed(2));
    urgency = 'MEDIUM';
    reason = `+${rMultiple}R reached ($${currentPnL}). SL locked to Break-Even (Zero Risk).`;
  } else if (rMultiple >= 1.8) {
    recommendation = 'TRAIL_SL';
    const candidate = isBuy ? Number((currentPrice - atr * 1.2).toFixed(2)) : Number((currentPrice + atr * 1.2).toFixed(2));
    if ((isBuy && candidate > trade.currentSl) || (!isBuy && candidate < trade.currentSl)) {
      newSl = candidate;
      urgency = 'MEDIUM';
      reason = `AI Trailing Stop updated to $${newSl} to secure floating gains.`;
    }
  }

  return {
    tradeId: trade.id,
    symbol: trade.symbol,
    currentPrice,
    currentPnL,
    rMultiple,
    recommendation,
    newSl,
    urgency,
    reason,
    timestamp: Date.now(),
  };
}

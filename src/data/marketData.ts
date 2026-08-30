import { AssetSymbol, Candle, StrategyConfig } from '../types';

// Deterministic seedable pseudo-random helper for consistent yet rich price curves
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateMarketCandles(
  symbol: AssetSymbol,
  candleCount: number = 180,
  config?: StrategyConfig
): Candle[] {
  const isGold = symbol === 'XAUUSD';
  let basePrice = isGold ? 2340.0 : 76.50;
  const priceStep = isGold ? 0.8 : 0.15;
  const digits = isGold ? 2 : 2;

  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000; // 15-minute candles
  const startTime = now - candleCount * intervalMs;

  let currentPrice = basePrice;
  let trendBias = 1; // 1: bullish, -1: bearish
  let trendDuration = 0;

  for (let i = 0; i < candleCount; i++) {
    const candleTime = startTime + i * intervalMs;
    const date = new Date(candleTime);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();

    // Session determination
    let session: 'ASIAN' | 'LONDON' | 'NY' | 'OVERLAP' = 'ASIAN';
    let volMultiplier = 0.6; // Asian consolidation

    if (hour >= 7 && hour < 12) {
      session = 'LONDON';
      volMultiplier = 1.3;
    } else if (hour >= 12 && hour < 16) {
      session = 'OVERLAP';
      volMultiplier = 1.8; // Peak volatility (London/NY overlap)
    } else if (hour >= 16 && hour < 21) {
      session = 'NY';
      volMultiplier = 1.2;
    }

    // Trend shifts every 20-35 candles
    if (trendDuration > 25 + Math.floor(pseudoRandom(i * 13) * 15)) {
      trendBias = trendBias === 1 ? -1 : 1;
      trendDuration = 0;
    }
    trendDuration++;

    // Random walk with trend drift and session volatility
    const rand = pseudoRandom(i * 17 + (isGold ? 100 : 500));
    const rand2 = pseudoRandom(i * 31 + 7);
    const rand3 = pseudoRandom(i * 47 + 13);
    const rand4 = pseudoRandom(i * 61 + 19);

    const drift = trendBias * priceStep * (0.3 + rand * 0.7) * volMultiplier;
    const noise = (rand2 - 0.48) * priceStep * 1.6 * volMultiplier;
    const delta = drift + noise;

    const open = currentPrice;
    const close = Number((open + delta).toFixed(digits));
    const range = Math.abs(close - open) + rand3 * priceStep * 1.5 * volMultiplier;
    const high = Number((Math.max(open, close) + range * rand4 * 0.6).toFixed(digits));
    const low = Number((Math.min(open, close) - range * (1 - rand4) * 0.6).toFixed(digits));

    const volume = Math.floor((1200 + rand * 3500) * volMultiplier);

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' ' + (date.getMonth() + 1) + '/' + date.getDate();

    candles.push({
      time: candleTime,
      timeStr,
      open,
      high,
      low,
      close,
      volume,
      session,
    });

    currentPrice = close;
  }

  // Calculate Technical Indicators
  calculateIndicators(candles, config);

  return candles;
}

export function calculateIndicators(candles: Candle[], config?: StrategyConfig) {
  const fastPeriod = config?.fastEmaPeriod || 9;
  const slowPeriod = config?.slowEmaPeriod || 21;
  const trendPeriod = config?.trendEmaPeriod || 200;
  const atrPeriod = config?.atrPeriod || 14;
  const rsiPeriod = config?.rsiPeriod || 14;
  const stPeriod = config?.supertrendPeriod || 10;
  const stMultiplier = config?.supertrendMultiplier || 3.0;

  // EMAs calculation
  calculateEMA(candles, fastPeriod, 'emaFast');
  calculateEMA(candles, slowPeriod, 'emaSlow');
  calculateEMA(candles, trendPeriod, 'emaTrend');

  // ATR calculation
  calculateATR(candles, atrPeriod);

  // RSI calculation
  calculateRSI(candles, rsiPeriod);

  // Supertrend calculation
  calculateSupertrend(candles, stPeriod, stMultiplier);
}

function calculateEMA(candles: Candle[], period: number, key: 'emaFast' | 'emaSlow' | 'emaTrend') {
  const k = 2 / (period + 1);
  let ema = candles[0].close;

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      // simple average for warm up
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += candles[j].close;
      ema = sum / (i + 1);
    } else {
      ema = candles[i].close * k + ema * (1 - k);
    }
    candles[i][key] = Number(ema.toFixed(2));
  }
}

function calculateATR(candles: Candle[], period: number) {
  const trs: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (i === 0) {
      trs.push(c.high - c.low);
    } else {
      const prevClose = candles[i - 1].close;
      const tr = Math.max(
        c.high - c.low,
        Math.abs(c.high - prevClose),
        Math.abs(c.low - prevClose)
      );
      trs.push(tr);
    }
  }

  let atr = trs[0];
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += trs[j];
      atr = sum / (i + 1);
    } else {
      atr = (atr * (period - 1) + trs[i]) / period;
    }
    candles[i].atr = Number(atr.toFixed(2));
  }
}

function calculateRSI(candles: Candle[], period: number) {
  let gains: number[] = [];
  let losses: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      candles[i].rsi = 50;
      continue;
    }

    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      candles[i].rsi = 50;
      continue;
    }

    let avgGain = 0;
    let avgLoss = 0;
    if (i === period) {
      for (let j = 1; j <= period; j++) {
        avgGain += gains[j];
        avgLoss += losses[j];
      }
      avgGain /= period;
      avgLoss /= period;
    } else {
      const prevRsi = candles[i - 1].rsi || 50;
      // standard smoothed Wilder's RSI
      avgGain = (gains[i] + (period - 1) * (prevRsi > 50 ? gains[i - 1] : 0.01)) / period;
      avgLoss = (losses[i] + (period - 1) * (prevRsi < 50 ? losses[i - 1] : 0.01)) / period;
    }

    if (avgLoss === 0) {
      candles[i].rsi = 100;
    } else {
      const rs = avgGain / avgLoss;
      candles[i].rsi = Number((100 - 100 / (1 + rs)).toFixed(1));
    }
  }
}

function calculateSupertrend(candles: Candle[], period: number, multiplier: number) {
  let prevUpper = 0;
  let prevLower = 0;
  let prevSupertrend = 0;
  let prevDir: 1 | -1 = 1;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const atr = c.atr || 1.0;
    const hl2 = (c.high + c.low) / 2;

    let upperBand = hl2 + multiplier * atr;
    let lowerBand = hl2 - multiplier * atr;

    if (i > 0) {
      const prevClose = candles[i - 1].close;
      if (lowerBand > prevLower || prevClose < prevLower) {
        // keep updated
      } else {
        lowerBand = prevLower;
      }

      if (upperBand < prevUpper || prevClose > prevUpper) {
        // keep updated
      } else {
        upperBand = prevUpper;
      }

      let dir: 1 | -1 = prevDir;
      if (prevDir === 1 && c.close < lowerBand) {
        dir = -1;
      } else if (prevDir === -1 && c.close > upperBand) {
        dir = 1;
      }

      const supertrend = dir === 1 ? lowerBand : upperBand;
      c.supertrend = Number(supertrend.toFixed(2));
      c.supertrendDir = dir;

      prevUpper = upperBand;
      prevLower = lowerBand;
      prevSupertrend = supertrend;
      prevDir = dir;
    } else {
      c.supertrend = Number(lowerBand.toFixed(2));
      c.supertrendDir = 1;
      prevUpper = upperBand;
      prevLower = lowerBand;
      prevSupertrend = lowerBand;
      prevDir = 1;
    }
  }
}

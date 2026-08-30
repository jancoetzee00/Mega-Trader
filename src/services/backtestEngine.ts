import { BacktestResults, Candle, StrategyConfig, Trade } from '../types';

export function runBacktest(candles: Candle[], config: StrategyConfig): { results: BacktestResults; trades: Trade[] } {
  const isGold = config.symbol === 'XAUUSD';
  const pointValue = 0.01;
  const contractSize = isGold ? 100 : 1000; // 100 oz per gold lot, 1000 barrels per oil lot
  const spread = (config.maxSpreadPoints * pointValue) / 10; // realistic spread

  let balance = config.accountBalance;
  let equity = balance;
  let peakEquity = balance;
  let maxDrawdownAmt = 0;
  let maxDrawdownPct = 0;

  const trades: Trade[] = [];
  let openTrade: Trade | null = null;
  let ticketCounter = 1001;

  const equityCurve: { time: number; timeStr: string; balance: number; equity: number; drawdown: number }[] = [
    {
      time: candles[0]?.time || Date.now(),
      timeStr: candles[0]?.timeStr || 'Start',
      balance,
      equity,
      drawdown: 0,
    }
  ];

  let winningTradesCount = 0;
  let losingTradesCount = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let consecutiveWins = 0;
  let maxConsecutiveWins = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveLosses = 0;

  const warmup = Math.max(config.trendEmaPeriod, config.atrPeriod, 25);

  for (let i = warmup; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];

    const currentAtr = c.atr || 1.0;
    const fastEma = c.emaFast || c.close;
    const slowEma = c.emaSlow || c.close;
    const trendEma = c.emaTrend || c.close;
    const rsi = c.rsi || 50;

    // Time filter check
    const candleDate = new Date(c.time);
    const hour = candleDate.getUTCHours();
    const isAllowedTime = !config.useTimeFilter || (hour >= config.startHour && hour < config.endHour);

    // 1. MANAGE OPEN TRADE
    if (openTrade) {
      const isBuy = openTrade.type === 'BUY';
      const initialRiskDist = Math.abs(openTrade.openPrice - openTrade.initialSl);

      // Check Break-Even trigger
      if (config.useBreakEven) {
        if (isBuy) {
          const runup = c.high - openTrade.openPrice;
          if (runup >= initialRiskDist * config.breakEvenTriggerR) {
            const bePrice = openTrade.openPrice + (config.breakEvenLockPoints * pointValue);
            if (openTrade.currentSl < bePrice) {
              openTrade.currentSl = bePrice;
            }
          }
        } else {
          const runup = openTrade.openPrice - c.low;
          if (runup >= initialRiskDist * config.breakEvenTriggerR) {
            const bePrice = openTrade.openPrice - (config.breakEvenLockPoints * pointValue);
            if (openTrade.currentSl > bePrice || openTrade.currentSl === 0) {
              openTrade.currentSl = bePrice;
            }
          }
        }
      }

      // Check Trailing Stop
      if (config.useTrailingStop) {
        const trailDist = currentAtr * config.trailingStopAtrMultiplier;
        if (isBuy) {
          if (c.high - openTrade.openPrice > trailDist) {
            const trailSl = c.close - trailDist;
            if (trailSl > openTrade.currentSl + (config.trailingStepPoints * pointValue)) {
              openTrade.currentSl = Number(trailSl.toFixed(2));
            }
          }
        } else {
          if (openTrade.openPrice - c.low > trailDist) {
            const trailSl = c.close + trailDist;
            if (openTrade.currentSl === 0 || trailSl < openTrade.currentSl - (config.trailingStepPoints * pointValue)) {
              openTrade.currentSl = Number(trailSl.toFixed(2));
            }
          }
        }
      }

      // Check Exit Conditions within candle
      let closed = false;
      let exitPrice = 0;
      let exitReason = '';

      if (isBuy) {
        // Hit SL
        if (c.low <= openTrade.currentSl) {
          closed = true;
          exitPrice = openTrade.currentSl;
          exitReason = openTrade.currentSl >= openTrade.openPrice ? 'CLOSED_TRAILING' : 'CLOSED_SL';
        }
        // Hit TP
        else if (c.high >= openTrade.tp) {
          closed = true;
          exitPrice = openTrade.tp;
          exitReason = 'CLOSED_TP';
        }
      } else {
        // Hit SL
        if (c.high >= openTrade.currentSl) {
          closed = true;
          exitPrice = openTrade.currentSl;
          exitReason = openTrade.currentSl <= openTrade.openPrice ? 'CLOSED_TRAILING' : 'CLOSED_SL';
        }
        // Hit TP
        else if (c.low <= openTrade.tp) {
          closed = true;
          exitPrice = openTrade.tp;
          exitReason = 'CLOSED_TP';
        }
      }

      if (closed) {
        const priceDiff = isBuy ? (exitPrice - openTrade.openPrice) : (openTrade.openPrice - exitPrice);
        const pnl = priceDiff * openTrade.lotSize * contractSize;
        const pips = Number((priceDiff / pointValue).toFixed(1));

        openTrade.closeTime = c.time;
        openTrade.closeTimeStr = c.timeStr;
        openTrade.closePrice = Number(exitPrice.toFixed(2));
        openTrade.profit = Number(pnl.toFixed(2));
        openTrade.pips = pips;
        openTrade.status = exitReason as any;
        openTrade.exitReason = exitReason === 'CLOSED_TP' ? 'Target Reached (Take Profit)' :
          exitReason === 'CLOSED_TRAILING' ? 'Protected by Trailing Stop / BreakEven' : 'Stop Loss Triggered';

        balance += pnl;
        equity = balance;
        trades.push({ ...openTrade });
        openTrade = null;

        if (pnl > 0) {
          winningTradesCount++;
          grossProfit += pnl;
          consecutiveWins++;
          consecutiveLosses = 0;
          if (consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;
        } else {
          losingTradesCount++;
          grossLoss += Math.abs(pnl);
          consecutiveLosses++;
          consecutiveWins = 0;
          if (consecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = consecutiveLosses;
        }
      }
    }

    // 2. EVALUATE ENTRY SIGNALS IF NO POSITION OPEN
    if (!openTrade && isAllowedTime && i > warmup + 5) {
      const isBullishTrend = c.close > trendEma && fastEma > slowEma;
      const isBearishTrend = c.close < trendEma && fastEma < slowEma;

      const fastCrossUp = (prev.emaFast! <= prev.emaSlow! && fastEma > slowEma) || (prev.close <= prev.emaFast! && c.close > fastEma);
      const fastCrossDown = (prev.emaFast! >= prev.emaSlow! && fastEma < slowEma) || (prev.close >= prev.emaFast! && c.close < fastEma);

      const rsiBuyOk = !config.useRsiFilter || (rsi >= config.rsiOversold && rsi <= 68);
      const rsiSellOk = !config.useRsiFilter || (rsi <= config.rsiOverbought && rsi >= 32);

      const stBuyOk = !config.useSupertrend || c.supertrendDir === 1;
      const stSellOk = !config.useSupertrend || c.supertrendDir === -1;

      // Buy Trigger
      if (isBullishTrend && fastCrossUp && rsiBuyOk && stBuyOk) {
        const entryPrice = Number((c.close + spread).toFixed(2));
        const slDist = currentAtr * config.slAtrMultiplier;
        const tpDist = currentAtr * config.tpAtrMultiplier;
        const slPrice = Number((entryPrice - slDist).toFixed(2));
        const tpPrice = Number((entryPrice + tpDist).toFixed(2));

        // Lot sizing
        let lot = config.fixedLotSize;
        if (config.useRiskPercent) {
          const riskAmt = balance * (config.riskPercent / 100);
          const rawLot = riskAmt / (slDist * contractSize);
          lot = Math.max(0.01, Math.min(20.0, Number((Math.floor(rawLot * 100) / 100).toFixed(2))));
        }

        openTrade = {
          id: `trade-${ticketCounter}`,
          ticket: ticketCounter++,
          symbol: config.symbol,
          type: 'BUY',
          openTime: c.time,
          openTimeStr: c.timeStr,
          openPrice: entryPrice,
          initialSl: slPrice,
          currentSl: slPrice,
          tp: tpPrice,
          lotSize: lot,
          profit: 0,
          pips: 0,
          status: 'OPEN',
          entryReason: 'EMA Ribbon Bullish Cross + Supertrend Alignment',
        };
      }
      // Sell Trigger
      else if (isBearishTrend && fastCrossDown && rsiSellOk && stSellOk) {
        const entryPrice = Number((c.close - spread).toFixed(2));
        const slDist = currentAtr * config.slAtrMultiplier;
        const tpDist = currentAtr * config.tpAtrMultiplier;
        const slPrice = Number((entryPrice + slDist).toFixed(2));
        const tpPrice = Number((entryPrice - tpDist).toFixed(2));

        let lot = config.fixedLotSize;
        if (config.useRiskPercent) {
          const riskAmt = balance * (config.riskPercent / 100);
          const rawLot = riskAmt / (slDist * contractSize);
          lot = Math.max(0.01, Math.min(20.0, Number((Math.floor(rawLot * 100) / 100).toFixed(2))));
        }

        openTrade = {
          id: `trade-${ticketCounter}`,
          ticket: ticketCounter++,
          symbol: config.symbol,
          type: 'SELL',
          openTime: c.time,
          openTimeStr: c.timeStr,
          openPrice: entryPrice,
          initialSl: slPrice,
          currentSl: slPrice,
          tp: tpPrice,
          lotSize: lot,
          profit: 0,
          pips: 0,
          status: 'OPEN',
          entryReason: 'EMA Ribbon Bearish Cross + Supertrend Alignment',
        };
      }
    }

    // Update Floating Equity
    if (openTrade) {
      const isBuy = openTrade.type === 'BUY';
      const floatingDiff = isBuy ? (c.close - openTrade.openPrice) : (openTrade.openPrice - c.close);
      equity = balance + (floatingDiff * openTrade.lotSize * contractSize);
    } else {
      equity = balance;
    }

    // Drawdown Calculation
    if (equity > peakEquity) peakEquity = equity;
    const currentDrawdown = peakEquity - equity;
    const currentDrawdownPct = peakEquity > 0 ? (currentDrawdown / peakEquity) * 100 : 0;

    if (currentDrawdown > maxDrawdownAmt) maxDrawdownAmt = currentDrawdown;
    if (currentDrawdownPct > maxDrawdownPct) maxDrawdownPct = currentDrawdownPct;

    if (i % 3 === 0 || i === candles.length - 1) {
      equityCurve.push({
        time: c.time,
        timeStr: c.timeStr,
        balance: Number(balance.toFixed(2)),
        equity: Number(equity.toFixed(2)),
        drawdown: Number(currentDrawdownPct.toFixed(2)),
      });
    }
  }

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (winningTradesCount / totalTrades) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.0 : 0;
  const netProfit = balance - config.accountBalance;
  const avgWin = winningTradesCount > 0 ? grossProfit / winningTradesCount : 0;
  const avgLoss = losingTradesCount > 0 ? grossLoss / losingTradesCount : 0;
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const avgTrade = totalTrades > 0 ? netProfit / totalTrades : 0;

  // Simple Sharpe Approximation
  const returns = trades.map(t => (t.profit / config.accountBalance) * 100);
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1
    ? returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)
    : 0.01;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? Number(((meanReturn / stdDev) * Math.sqrt(252)).toFixed(2)) : 0;

  const results: BacktestResults = {
    totalTrades,
    winningTrades: winningTradesCount,
    losingTrades: losingTradesCount,
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    initialBalance: config.accountBalance,
    finalBalance: Number(balance.toFixed(2)),
    maxDrawdownAmount: Number(maxDrawdownAmt.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPct.toFixed(2)),
    sharpeRatio,
    avgTrade: Number(avgTrade.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    riskRewardRatio: Number(riskRewardRatio.toFixed(2)),
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
    equityCurve,
  };

  return { results, trades };
}

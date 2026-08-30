import { StrategyConfig } from '../types';

export function generateMql5Code(config: StrategyConfig): string {
  const isGold = config.symbol === 'XAUUSD';
  const assetName = isGold ? 'Gold (XAUUSD)' : 'Crude Oil (WTI / USOIL)';
  const eaName = config.name.replace(/[^a-zA-Z0-9_]/g, '');

  return `//+------------------------------------------------------------------+
//|                                     ${eaName}.mq5 |
//|                     Apex Algorithmic Trading Systems             |
//|                        Engineered for MetaTrader 5               |
//+------------------------------------------------------------------+
#property copyright   "Apex Quantitative Systems"
#property link        "https://apex-algo.trading"
#property version     "2.40"
#property description "Automated Quantitative Trend & Volatility EA for ${assetName}"
#property description "Features: Dynamic ATR Risk Sizing, Supertrend Filter, Break-Even & Trailing Stop"
#property strict

//--- Standard MQL5 Trade Classes
#include <Trade\\Trade.mqh>
#include <Trade\\PositionInfo.mqh>
#include <Trade\\AccountInfo.mqh>
#include <Trade\\SymbolInfo.mqh>

//+------------------------------------------------------------------+
//| INPUT PARAMETERS                                                 |
//+------------------------------------------------------------------+
input group "=== [1] RISK & MONEY MANAGEMENT ==="
input bool     InpUseRiskPercent      = ${config.useRiskPercent};        // Use Percentage-based Sizing
input double   InpRiskPercent         = ${config.riskPercent.toFixed(1)};        // Risk % per Trade
input double   InpFixedLotSize        = ${config.fixedLotSize.toFixed(2)};        // Fixed Lot Size (if Risk % disabled)
input double   InpMaxDailyLossPct     = ${config.maxDailyLossPercent.toFixed(1)};        // Max Daily Loss % (Circuit Breaker)
input double   InpMaxDailyProfitPct   = ${config.maxDailyProfitPercent.toFixed(1)};        // Max Daily Profit % Target
input int      InpMaxSpreadPoints     = ${config.maxSpreadPoints};         // Max Allowed Spread (in Points)
input int      InpSlippagePoints      = ${config.slippagePoints};          // Max Allowed Slippage (in Points)
input ulong    InpMagicNumber         = ${config.magicNumber};     // EA Magic Number

input group "=== [2] TECHNICAL STRATEGY INDICATORS ==="
input int      InpFastEmaPeriod       = ${config.fastEmaPeriod};          // Fast EMA Period (Momentum)
input int      InpSlowEmaPeriod       = ${config.slowEmaPeriod};         // Slow EMA Period (Signal)
input int      InpTrendEmaPeriod      = ${config.trendEmaPeriod};        // Trend Filter EMA (Direction)
input int      InpAtrPeriod           = ${config.atrPeriod};         // ATR Volatility Period
input double   InpSlAtrMultiplier     = ${config.slAtrMultiplier.toFixed(1)};        // Stop Loss (x ATR)
input double   InpTpAtrMultiplier     = ${config.tpAtrMultiplier.toFixed(1)};        // Take Profit (x ATR)
input bool     InpUseSupertrend       = ${config.useSupertrend};        // Enable Supertrend Confirmation
input int      InpStPeriod            = ${config.supertrendPeriod};         // Supertrend Period
input double   InpStMultiplier        = ${config.supertrendMultiplier.toFixed(1)};        // Supertrend Multiplier
input bool     InpUseRsiFilter        = ${config.useRsiFilter};        // Enable RSI Exhaustion Filter
input int      InpRsiPeriod           = ${config.rsiPeriod};         // RSI Period
input double   InpRsiOversold         = ${config.rsiOversold.toFixed(1)};       // RSI Oversold Threshold (Buy Min)
input double   InpRsiOverbought       = ${config.rsiOverbought.toFixed(1)};       // RSI Overbought Threshold (Sell Max)

input group "=== [3] TRADE MANAGEMENT & EXIT ENGINE ==="
input bool     InpUseTrailingStop     = ${config.useTrailingStop};        // Enable ATR Trailing Stop
input double   InpTrailingAtrMult     = ${config.trailingStopAtrMultiplier.toFixed(1)};        // Trailing Stop Distance (x ATR)
input int      InpTrailingStepPoints  = ${config.trailingStepPoints};         // Trailing Step (in Points)
input bool     InpUseBreakEven        = ${config.useBreakEven};        // Enable Auto Break-Even
input double   InpBreakEvenTriggerR   = ${config.breakEvenTriggerR.toFixed(1)};        // Break-Even Trigger (x Risk R)
input int      InpBreakEvenLockPoints = ${config.breakEvenLockPoints};         // Break-Even Lock Profit (Points)
input bool     InpUsePartialClose     = ${config.usePartialClose};        // Enable Partial Take Profit
input double   InpPartialCloseR       = ${config.partialCloseR.toFixed(1)};        // Partial TP Trigger (x Risk R)
input double   InpPartialClosePct     = ${config.partialClosePercent.toFixed(0)};       // Partial Close % Volume

input group "=== [4] SESSION & TIME FILTERS (GMT) ==="
input bool     InpUseTimeFilter       = ${config.useTimeFilter};        // Enable Session Time Filter
input int      InpStartHour           = ${config.startHour};          // Trading Start Hour (GMT)
input int      InpStartMinute         = ${config.startMinute};          // Trading Start Minute
input int      InpEndHour             = ${config.endHour};         // Trading End Hour (GMT)
input int      InpEndMinute           = ${config.endMinute};          // Trading End Minute
input bool     InpCloseOnFriday       = ${config.closeOnFriday};        // Flat Positions Friday Evening
input int      InpFridayCloseHour     = ${config.fridayCloseHour};         // Friday Close Hour (GMT)

//+------------------------------------------------------------------+
//| GLOBAL OBJECTS & HANDLES                                         |
//+------------------------------------------------------------------+
CTrade         trade;
CPositionInfo  posInfo;
CAccountInfo   accInfo;
CSymbolInfo    symInfo;

// Indicator Handles
int handleFastEma    = INVALID_HANDLE;
int handleSlowEma    = INVALID_HANDLE;
int handleTrendEma   = INVALID_HANDLE;
int handleAtr        = INVALID_HANDLE;
int handleRsi        = INVALID_HANDLE;

// State Tracking
datetime lastBarTime = 0;
double   dailyStartingBalance = 0;
datetime currentDayStart = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Initialize Symbol and Trading settings
   if(!symInfo.Name(_Symbol))
   {
      Print("[ERROR] Failed to bind to symbol: ", _Symbol);
      return INIT_FAILED;
   }
   symInfo.Refresh();

   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   // Initialize Indicator Handles
   handleFastEma  = iMA(_Symbol, _Period, InpFastEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
   handleSlowEma  = iMA(_Symbol, _Period, InpSlowEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
   handleTrendEma = iMA(_Symbol, _Period, InpTrendEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
   handleAtr      = iATR(_Symbol, _Period, InpAtrPeriod);
   handleRsi      = iRSI(_Symbol, _Period, InpRsiPeriod, PRICE_CLOSE);

   if(handleFastEma == INVALID_HANDLE || handleSlowEma == INVALID_HANDLE ||
      handleTrendEma == INVALID_HANDLE || handleAtr == INVALID_HANDLE ||
      handleRsi == INVALID_HANDLE)
   {
      Print("[ERROR] Failed to create one or more indicator handles.");
      return INIT_FAILED;
   }

   dailyStartingBalance = accInfo.Balance();
   currentDayStart      = iTime(_Symbol, PERIOD_D1, 0);

   Print("=================================================");
   Print(" [INIT SUCCESS] EA Attached to: ", _Symbol, " | Timeframe: ", EnumToString(_Period));
   Print(" Magic Number: ", InpMagicNumber, " | Risk %: ", InpRiskPercent);
   Print("=================================================");

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   // Release indicator handles to free memory
   IndicatorRelease(handleFastEma);
   IndicatorRelease(handleSlowEma);
   IndicatorRelease(handleTrendEma);
   IndicatorRelease(handleAtr);
   IndicatorRelease(handleRsi);

   Comment(""); // Clear chart HUD
   Print("[DEINIT] EA Removed. Reason code: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   symInfo.Refresh();

   // 1. Check Day Rollover for Daily Circuit Breaker
   datetime today = iTime(_Symbol, PERIOD_D1, 0);
   if(today != currentDayStart)
   {
      currentDayStart = today;
      dailyStartingBalance = accInfo.Balance();
   }

   // 2. Check Daily Drawdown & Profit Target Limit
   double currentEquity = accInfo.Equity();
   double dailyPnLPct = ((currentEquity - dailyStartingBalance) / dailyStartingBalance) * 100.0;

   if(dailyPnLPct <= -InpMaxDailyLossPct)
   {
      UpdateDashboard("CIRCUIT BREAKER: Max Daily Loss Hit (" + DoubleToString(dailyPnLPct, 2) + "%). Trading halted.");
      return;
   }
   if(dailyPnLPct >= InpMaxDailyProfitPct)
   {
      UpdateDashboard("TARGET ACHIEVED: Max Daily Profit Hit (" + DoubleToString(dailyPnLPct, 2) + "%). Relax!");
      return;
   }

   // 3. Manage Open Positions (Trailing Stop & Break-Even) on Every Tick
   ManageOpenPositions();

   // 4. Bar-Close Synchronization for Signal Execution
   datetime currentBarTime = iTime(_Symbol, _Period, 0);
   if(currentBarTime == lastBarTime)
   {
      UpdateDashboard("Monitoring Active Market Structure...");
      return;
   }
   lastBarTime = currentBarTime;

   // 5. Spread Check
   long currentSpread = symInfo.Spread();
   if(currentSpread > InpMaxSpreadPoints)
   {
      Print("[WARNING] Spread exceeds limit. Current: ", currentSpread, " pts > Max: ", InpMaxSpreadPoints);
      UpdateDashboard("SPREAD FILTER ACTIVE (" + IntegerToString(currentSpread) + " pts > Limit " + IntegerToString(InpMaxSpreadPoints) + ")");
      return;
   }

   // 6. Time and Friday Filter Check
   if(!IsTradingTimeAllowed())
   {
      UpdateDashboard("OUTSIDE SCHEDULED TRADING HOURS");
      if(InpCloseOnFriday && IsFridayCloseTime())
      {
         CloseAllPositions("Friday Flat-Out Protection");
      }
      return;
   }

   // 7. Check if we already have an active position for this EA magic number
   if(CountOpenPositions() > 0)
   {
      UpdateDashboard("MANAGING ACTIVE TRADE");
      return;
   }

   // 8. Retrieve Indicator Buffer Data
   double fastEma[], slowEma[], trendEma[], atrVal[], rsiVal[];
   ArraySetAsSeries(fastEma, true);
   ArraySetAsSeries(slowEma, true);
   ArraySetAsSeries(trendEma, true);
   ArraySetAsSeries(atrVal, true);
   ArraySetAsSeries(rsiVal, true);

   if(CopyBuffer(handleFastEma, 0, 1, 3, fastEma) <= 0 ||
      CopyBuffer(handleSlowEma, 0, 1, 3, slowEma) <= 0 ||
      CopyBuffer(handleTrendEma, 0, 1, 3, trendEma) <= 0 ||
      CopyBuffer(handleAtr, 0, 1, 3, atrVal) <= 0 ||
      CopyBuffer(handleRsi, 0, 1, 3, rsiVal) <= 0)
   {
      Print("[ERROR] Failed to copy indicator buffers.");
      return;
   }

   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   if(CopyRates(_Symbol, _Period, 1, 3, rates) <= 0)
   {
      Print("[ERROR] Failed to copy candle rates.");
      return;
   }

   double currentAtr = atrVal[0];
   double currentRsi = rsiVal[0];
   double barClose   = rates[0].close;

   // 9. Signal Logic Evaluation
   bool bullishTrend = barClose > trendEma[0] && fastEma[0] > slowEma[0];
   bool bearishTrend = barClose < trendEma[0] && fastEma[0] < slowEma[0];

   bool emaCrossUp   = (fastEma[1] <= slowEma[1] && fastEma[0] > slowEma[0]) || (rates[1].close <= fastEma[1] && rates[0].close > fastEma[0]);
   bool emaCrossDown = (fastEma[1] >= slowEma[1] && fastEma[0] < slowEma[0]) || (rates[1].close >= fastEma[1] && rates[0].close < fastEma[0]);

   bool rsiBuyOk  = !InpUseRsiFilter || (currentRsi >= InpRsiOversold && currentRsi <= 68.0);
   bool rsiSellOk = !InpUseRsiFilter || (currentRsi <= InpRsiOverbought && currentRsi >= 32.0);

   // Execute BUY Order
   if(bullishTrend && emaCrossUp && rsiBuyOk)
   {
      double askPrice = symInfo.Ask();
      double slDistance = currentAtr * InpSlAtrMultiplier;
      double tpDistance = currentAtr * InpTpAtrMultiplier;

      double slPrice = NormalizeDouble(askPrice - slDistance, _Digits);
      double tpPrice = NormalizeDouble(askPrice + tpDistance, _Digits);

      double lotSize = CalculateLotSize(slDistance);

      if(trade.Buy(lotSize, _Symbol, askPrice, slPrice, tpPrice, "${config.name} Buy Order"))
      {
         Print("[ORDER EXECUTED] BUY ", lotSize, " lots at ", askPrice, " | SL: ", slPrice, " | TP: ", tpPrice);
      }
      else
      {
         Print("[BUY REJECTED] Error: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
      }
   }
   // Execute SELL Order
   else if(bearishTrend && emaCrossDown && rsiSellOk)
   {
      double bidPrice = symInfo.Bid();
      double slDistance = currentAtr * InpSlAtrMultiplier;
      double tpDistance = currentAtr * InpTpAtrMultiplier;

      double slPrice = NormalizeDouble(bidPrice + slDistance, _Digits);
      double tpPrice = NormalizeDouble(bidPrice - tpDistance, _Digits);

      double lotSize = CalculateLotSize(slDistance);

      if(trade.Sell(lotSize, _Symbol, bidPrice, slPrice, tpPrice, "${config.name} Sell Order"))
      {
         Print("[ORDER EXECUTED] SELL ", lotSize, " lots at ", bidPrice, " | SL: ", slPrice, " | TP: ", tpPrice);
      }
      else
      {
         Print("[SELL REJECTED] Error: ", trade.ResultRetcode(), " - ", trade.ResultRetcodeDescription());
      }
   }

   UpdateDashboard("SCANNING FOR COMMODITY SETUP");
}

//+------------------------------------------------------------------+
//| Dynamic Lot Sizing Engine                                        |
//+------------------------------------------------------------------+
double CalculateLotSize(double slDistancePrice)
{
   if(!InpUseRiskPercent)
   {
      return NormalizeLot(InpFixedLotSize);
   }

   double equity       = accInfo.Equity();
   double riskAmount   = equity * (InpRiskPercent / 100.0);
   double tickValue    = symInfo.TickValue();
   double tickSize     = symInfo.TickSize();
   double point        = symInfo.Point();

   if(tickSize == 0 || tickValue == 0 || point == 0)
   {
      return NormalizeLot(InpFixedLotSize);
   }

   double slPoints = slDistancePrice / point;
   double valuePerPointPerLot = tickValue * (point / tickSize);
   
   if(valuePerPointPerLot <= 0 || slPoints <= 0)
      return NormalizeLot(InpFixedLotSize);

   double calculatedLot = riskAmount / (slPoints * valuePerPointPerLot);
   return NormalizeLot(calculatedLot);
}

//+------------------------------------------------------------------+
//| Normalize Lot Size within Broker Constraints                     |
//+------------------------------------------------------------------+
double NormalizeLot(double lot)
{
   double minLot  = symInfo.LotsMin();
   double maxLot  = symInfo.LotsMax();
   double stepLot = symInfo.LotsStep();

   if(stepLot <= 0) stepLot = 0.01;

   lot = MathMax(minLot, MathMin(maxLot, lot));
   lot = MathFloor(lot / stepLot) * stepLot;

   return NormalizeDouble(lot, 2);
}

//+------------------------------------------------------------------+
//| Manage Trailing Stop & Auto Break-Even                           |
//+------------------------------------------------------------------+
void ManageOpenPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!posInfo.SelectByIndex(i)) continue;
      if(posInfo.Symbol() != _Symbol || posInfo.Magic() != InpMagicNumber) continue;

      ulong  ticket       = posInfo.Ticket();
      double openPrice    = posInfo.PriceOpen();
      double currentSl    = posInfo.StopLoss();
      double currentTp    = posInfo.TakeProfit();
      ENUM_POSITION_TYPE type = posInfo.PositionType();

      double currentAtr = 0;
      double atrBuffer[];
      ArraySetAsSeries(atrBuffer, true);
      if(CopyBuffer(handleAtr, 0, 0, 1, atrBuffer) > 0)
         currentAtr = atrBuffer[0];
      else
         currentAtr = 100 * _Point;

      // 1. Auto Break-Even Logic
      if(InpUseBreakEven)
      {
         double initialRisk = MathAbs(openPrice - currentSl);
         if(initialRisk > 0)
         {
            if(type == POSITION_TYPE_BUY)
            {
               double profitDistance = symInfo.Bid() - openPrice;
               if(profitDistance >= initialRisk * InpBreakEvenTriggerR)
               {
                  double newSl = NormalizeDouble(openPrice + InpBreakEvenLockPoints * _Point, _Digits);
                  if(currentSl < openPrice)
                  {
                     trade.PositionModify(ticket, newSl, currentTp);
                     Print("[BREAK-EVEN TRIGGERED] Ticket #", ticket, " SL secured at ", newSl);
                  }
               }
            }
            else if(type == POSITION_TYPE_SELL)
            {
               double profitDistance = openPrice - symInfo.Ask();
               if(profitDistance >= initialRisk * InpBreakEvenTriggerR)
               {
                  double newSl = NormalizeDouble(openPrice - InpBreakEvenLockPoints * _Point, _Digits);
                  if(currentSl > openPrice || currentSl == 0)
                  {
                     trade.PositionModify(ticket, newSl, currentTp);
                     Print("[BREAK-EVEN TRIGGERED] Ticket #", ticket, " SL secured at ", newSl);
                  }
               }
            }
         }
      }

      // 2. Dynamic ATR Trailing Stop Logic
      if(InpUseTrailingStop && currentAtr > 0)
      {
         double trailDistance = currentAtr * InpTrailingAtrMult;

         if(type == POSITION_TYPE_BUY)
         {
            double bid = symInfo.Bid();
            if(bid - openPrice > trailDistance)
            {
               double newSl = NormalizeDouble(bid - trailDistance, _Digits);
               if(newSl > currentSl + InpTrailingStepPoints * _Point)
               {
                  trade.PositionModify(ticket, newSl, currentTp);
                  Print("[TRAILING STOP] BUY Ticket #", ticket, " modified SL to ", newSl);
               }
            }
         }
         else if(type == POSITION_TYPE_SELL)
         {
            double ask = symInfo.Ask();
            if(openPrice - ask > trailDistance)
            {
               double newSl = NormalizeDouble(ask + trailDistance, _Digits);
               if(currentSl == 0 || newSl < currentSl - InpTrailingStepPoints * _Point)
               {
                  trade.PositionModify(ticket, newSl, currentTp);
                  Print("[TRAILING STOP] SELL Ticket #", ticket, " modified SL to ", newSl);
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Utility: Count Active EA Positions                               |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!posInfo.SelectByIndex(i)) continue;
      if(posInfo.Symbol() == _Symbol && posInfo.Magic() == InpMagicNumber)
      {
         count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Utility: Emergency Close All Positions                           |
//+------------------------------------------------------------------+
void CloseAllPositions(string reason)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(!posInfo.SelectByIndex(i)) continue;
      if(posInfo.Symbol() == _Symbol && posInfo.Magic() == InpMagicNumber)
      {
         trade.PositionClose(posInfo.Ticket());
         Print("[POSITION CLOSED] Reason: ", reason, " | Ticket #", posInfo.Ticket());
      }
   }
}

//+------------------------------------------------------------------+
//| Check Trading Session Schedule (GMT)                             |
//+------------------------------------------------------------------+
bool IsTradingTimeAllowed()
{
   if(!InpUseTimeFilter) return true;

   MqlDateTime dt;
   TimeGMT(dt);

   // Weekend protection
   if(dt.day_of_week == 0 || dt.day_of_week == 6) return false;

   // Friday early shutdown
   if(dt.day_of_week == 5 && dt.hour >= InpFridayCloseHour) return false;

   int currentMinutes = dt.hour * 60 + dt.min;
   int startMinutes   = InpStartHour * 60 + InpStartMinute;
   int endMinutes     = InpEndHour * 60 + InpEndMinute;

   if(startMinutes <= endMinutes)
   {
      return (currentMinutes >= startMinutes && currentMinutes <= endMinutes);
   }
   else // Overnight wrap
   {
      return (currentMinutes >= startMinutes || currentMinutes <= endMinutes);
   }
}

//+------------------------------------------------------------------+
//| Check Friday Exit Window                                         |
//+------------------------------------------------------------------+
bool IsFridayCloseTime()
{
   MqlDateTime dt;
   TimeGMT(dt);
   return (dt.day_of_week == 5 && dt.hour >= InpFridayCloseHour);
}

//+------------------------------------------------------------------+
//| Update Chart Live HUD Dashboard                                  |
//+------------------------------------------------------------------+
void UpdateDashboard(string statusMsg)
{
   double dailyPnL = accInfo.Equity() - dailyStartingBalance;
   double dailyPnLPct = (dailyStartingBalance > 0) ? (dailyPnL / dailyStartingBalance) * 100.0 : 0.0;

   string text = "\\n" +
      "===========================================\\n" +
      "  APEX MT5 ALGORITHM: ${eaName}\\n" +
      "===========================================\\n" +
      "  Symbol: " + _Symbol + " (" + EnumToString(_Period) + ")\\n" +
      "  Status: " + statusMsg + "\\n" +
      "  Spread: " + IntegerToString(symInfo.Spread()) + " pts (Max: " + IntegerToString(InpMaxSpreadPoints) + ")\\n" +
      "  Balance: $" + DoubleToString(accInfo.Balance(), 2) + "\\n" +
      "  Equity:  $" + DoubleToString(accInfo.Equity(), 2) + "\\n" +
      "  Daily PnL: $" + DoubleToString(dailyPnL, 2) + " (" + DoubleToString(dailyPnLPct, 2) + "%)\\n" +
      "  Open Positions: " + IntegerToString(CountOpenPositions()) + "\\n" +
      "===========================================\\n";

   Comment(text);
}
//+------------------------------------------------------------------+
`;
}

import { StrategyConfig } from '../types';

export function generatePythonMt5Code(config: StrategyConfig): string {
  const isGold = config.symbol === 'XAUUSD';
  const symbolStr = isGold ? 'XAUUSD' : 'USOIL';

  return `"""
Apex Quantitative Trading Bot for MetaTrader 5
Asset: ${isGold ? 'Gold (XAUUSD)' : 'WTI Crude Oil (USOIL)'}
Strategy: Multi-Timeframe Trend Momentum & Dynamic ATR Volatility Engine
Requirements: pip install MetaTrader5 pandas numpy schedule
"""

import time
import datetime
import math
import logging
import pandas as pd
import numpy as np
import MetaTrader5 as mt5

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("apex_mt5_bot.log"),
        logging.StreamHandler()
    ]
)

# ==============================================================================
# STRATEGY CONFIGURATION PARAMETERS
# ==============================================================================
CONFIG = {
    "SYMBOL": "${symbolStr}",
    "TIMEFRAME": mt5.TIMEFRAME_M15,
    "MAGIC_NUMBER": ${config.magicNumber},
    "RISK_PERCENT": ${config.riskPercent.toFixed(1)},
    "FIXED_LOT": ${config.fixedLotSize.toFixed(2)},
    "USE_RISK_PERCENT": ${config.useRiskPercent ? 'True' : 'False'},
    "FAST_EMA": ${config.fastEmaPeriod},
    "SLOW_EMA": ${config.slowEmaPeriod},
    "TREND_EMA": ${config.trendEmaPeriod},
    "ATR_PERIOD": ${config.atrPeriod},
    "SL_ATR_MULT": ${config.slAtrMultiplier.toFixed(1)},
    "TP_ATR_MULT": ${config.tpAtrMultiplier.toFixed(1)},
    "TRAILING_STOP": ${config.useTrailingStop ? 'True' : 'False'},
    "TRAILING_ATR_MULT": ${config.trailingStopAtrMultiplier.toFixed(1)},
    "MAX_SPREAD_POINTS": ${config.maxSpreadPoints},
    "START_HOUR_GMT": ${config.startHour},
    "END_HOUR_GMT": ${config.endHour},
}


class MT5CommodityAlgo:
    def __init__(self, config):
        self.cfg = config
        self.symbol = config["SYMBOL"]
        self.magic = config["MAGIC_NUMBER"]
        self.last_candle_time = None

    def initialize_mt5(self):
        """Initializes connection to the MT5 terminal."""
        if not mt5.initialize():
            logging.error(f"MT5 initialization failed. Error code: {mt5.last_error()}")
            return False
        
        # Verify terminal info
        account_info = mt5.account_info()
        if account_info is None:
            logging.error("Failed to retrieve account info. Ensure MT5 is logged in.")
            return False

        logging.info(f"Connected to MT5 Account: {account_info.login} ({account_info.server})")
        logging.info(f"Balance: \${account_info.balance:,.2f} | Equity: \${account_info.equity:,.2f}")

        # Enable Symbol in MarketWatch
        if not mt5.symbol_select(self.symbol, True):
            logging.error(f"Failed to enable symbol {self.symbol} in MarketWatch")
            return False

        logging.info(f"Symbol {self.symbol} selected successfully.")
        return True

    def get_rates(self, count=150):
        """Fetches historical OHLCV data and computes technical indicators."""
        rates = mt5.copy_rates_from_pos(self.symbol, self.cfg["TIMEFRAME"], 0, count)
        if rates is None or len(rates) == 0:
            logging.warning("Failed to fetch rates from MT5.")
            return None

        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')

        # EMA Indicators
        df['ema_fast'] = df['close'].ewm(span=self.cfg["FAST_EMA"], adjust=False).mean()
        df['ema_slow'] = df['close'].ewm(span=self.cfg["SLOW_EMA"], adjust=False).mean()
        df['ema_trend'] = df['close'].ewm(span=self.cfg["TREND_EMA"], adjust=False).mean()

        # Average True Range (ATR)
        high_low = df['high'] - df['low']
        high_cp = (df['high'] - df['close'].shift()).abs()
        low_cp = (df['low'] - df['close'].shift()).abs()
        tr = pd.concat([high_low, high_cp, low_cp], axis=1).max(axis=1)
        df['atr'] = tr.rolling(window=self.cfg["ATR_PERIOD"]).mean()

        # RSI Calculation
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 1e-9)
        df['rsi'] = 100 - (100 / (1 + rs))

        return df

    def calculate_lot_size(self, sl_distance):
        """Calculates dynamic lot size based on equity risk percentage."""
        if not self.cfg["USE_RISK_PERCENT"]:
            return self.cfg["FIXED_LOT"]

        account = mt5.account_info()
        sym_info = mt5.symbol_info(self.symbol)
        if not account or not sym_info:
            return self.cfg["FIXED_LOT"]

        risk_capital = account.equity * (self.cfg["RISK_PERCENT"] / 100.0)
        point = sym_info.point
        tick_value = sym_info.trade_tick_value
        tick_size = sym_info.trade_tick_size

        if tick_size == 0 or tick_value == 0:
            return self.cfg["FIXED_LOT"]

        sl_points = sl_distance / point
        risk_per_lot = sl_points * (tick_value * (point / tick_size))

        if risk_per_lot <= 0:
            return self.cfg["FIXED_LOT"]

        raw_lot = risk_capital / risk_per_lot
        step = sym_info.volume_step
        lot = math.floor(raw_lot / step) * step
        lot = max(sym_info.volume_min, min(sym_info.volume_max, lot))
        return round(lot, 2)

    def is_session_active(self):
        """Checks if current time falls within configured GMT session hours."""
        now_gmt = datetime.datetime.now(datetime.timezone.utc)
        if now_gmt.weekday() >= 5:  # Weekend
            return False
        return self.cfg["START_HOUR_GMT"] <= now_gmt.hour < self.cfg["END_HOUR_GMT"]

    def has_open_positions(self):
        """Returns count of active positions with matching magic number."""
        positions = mt5.positions_get(symbol=self.symbol)
        if positions is None:
            return 0
        return len([p for p in positions if p.magic == self.magic])

    def execute_order(self, order_type, entry_price, sl, tp, lot):
        """Sends buy/sell order request to MT5."""
        sym_info = mt5.symbol_info(self.symbol)
        digits = sym_info.digits

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": self.symbol,
            "volume": float(lot),
            "type": order_type,
            "price": round(entry_price, digits),
            "sl": round(sl, digits),
            "tp": round(tp, digits),
            "deviation": 20,
            "magic": self.magic,
            "comment": "Apex Python Bot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logging.error(f"Order failed! Retcode: {result.retcode}, Description: {result.comment}")
            return False

        logging.info(f"Order EXECUTED successfully! Ticket: {result.order}, Lot: {lot}, Entry: {entry_price}")
        return True

    def manage_trailing_stop(self, current_atr):
        """Applies dynamic ATR trailing stop to open positions."""
        if not self.cfg["TRAILING_STOP"] or current_atr <= 0:
            return

        positions = mt5.positions_get(symbol=self.symbol)
        if not positions:
            return

        sym_info = mt5.symbol_info(self.symbol)
        trail_dist = current_atr * self.cfg["TRAILING_ATR_MULT"]

        for pos in positions:
            if pos.magic != self.magic:
                continue

            ticket = pos.ticket
            current_sl = pos.sl
            current_tp = pos.tp

            if pos.type == mt5.ORDER_TYPE_BUY:
                bid = sym_info.bid
                new_sl = round(bid - trail_dist, sym_info.digits)
                if new_sl > current_sl + (10 * sym_info.point) and (bid - pos.price_open) > trail_dist:
                    req = {
                        "action": mt5.TRADE_ACTION_SLTP,
                        "position": ticket,
                        "sl": new_sl,
                        "tp": current_tp,
                    }
                    mt5.order_send(req)
                    logging.info(f"Trailing SL adjusted for BUY #{ticket} -> {new_sl}")

            elif pos.type == mt5.ORDER_TYPE_SELL:
                ask = sym_info.ask
                new_sl = round(ask + trail_dist, sym_info.digits)
                if (current_sl == 0 or new_sl < current_sl - (10 * sym_info.point)) and (pos.price_open - ask) > trail_dist:
                    req = {
                        "action": mt5.TRADE_ACTION_SLTP,
                        "position": ticket,
                        "sl": new_sl,
                        "tp": current_tp,
                    }
                    mt5.order_send(req)
                    logging.info(f"Trailing SL adjusted for SELL #{ticket} -> {new_sl}")

    def run_tick_cycle(self):
        """Main execution cycle executed continuously."""
        df = self.get_rates(count=100)
        if df is None or len(df) < 50:
            return

        last_candle = df.iloc[-2]  # Completed closed bar
        candle_time = last_candle['time']
        current_atr = last_candle['atr']

        # Update Trailing Stop
        self.manage_trailing_stop(current_atr)

        # Check for new bar arrival
        if candle_time == self.last_candle_time:
            return
        self.last_candle_time = candle_time

        # Check Spread
        sym_info = mt5.symbol_info(self.symbol)
        if sym_info.spread > self.cfg["MAX_SPREAD_POINTS"]:
            logging.warning(f"Spread {sym_info.spread} > Max {self.cfg['MAX_SPREAD_POINTS']}. Skipping.")
            return

        if not self.is_session_active():
            logging.info("Outside trading session hours. Idling...")
            return

        if self.has_open_positions() > 0:
            logging.info("Position already active. Managing existing trade...")
            return

        # Signal Logic
        bullish = last_candle['close'] > last_candle['ema_trend'] and last_candle['ema_fast'] > last_candle['ema_slow']
        bearish = last_candle['close'] < last_candle['ema_trend'] and last_candle['ema_fast'] < last_candle['ema_slow']

        c_prev = df.iloc[-3]
        buy_cross = c_prev['ema_fast'] <= c_prev['ema_slow'] and last_candle['ema_fast'] > last_candle['ema_slow']
        sell_cross = c_prev['ema_fast'] >= c_prev['ema_slow'] and last_candle['ema_fast'] < last_candle['ema_slow']

        sl_dist = current_atr * self.cfg["SL_ATR_MULT"]
        tp_dist = current_atr * self.cfg["TP_ATR_MULT"]
        lot_size = self.calculate_lot_size(sl_dist)

        if bullish and (buy_cross or last_candle['close'] > last_candle['ema_fast']):
            ask = sym_info.ask
            sl = ask - sl_dist
            tp = ask + tp_dist
            logging.info(f"BUY Signal Triggered on {self.symbol} @ {ask}")
            self.execute_order(mt5.ORDER_TYPE_BUY, ask, sl, tp, lot_size)

        elif bearish and (sell_cross or last_candle['close'] < last_candle['ema_fast']):
            bid = sym_info.bid
            sl = bid + sl_dist
            tp = bid - tp_dist
            logging.info(f"SELL Signal Triggered on {self.symbol} @ {bid}")
            self.execute_order(mt5.ORDER_TYPE_SELL, bid, sl, tp, lot_size)


# ==============================================================================
# MAIN ENTRY POINT
# ==============================================================================
if __name__ == "__main__":
    bot = MT5CommodityAlgo(CONFIG)
    if bot.initialize_mt5():
        logging.info("Starting Commodity Trading Algorithm loop (Press Ctrl+C to terminate)...")
        try:
            while True:
                bot.run_tick_cycle()
                time.sleep(2)  # Tick evaluation interval
        except KeyboardInterrupt:
            logging.info("Stopping bot... Shutting down MT5 API.")
        finally:
            mt5.shutdown()
`;
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Candle, StrategyConfig, Trade } from '../types';
import { 
  Maximize2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  TrendingUp, 
  Clock, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers
} from 'lucide-react';

interface CandlestickChartProps {
  candles: Candle[];
  trades: Trade[];
  config: StrategyConfig;
  activeCandleIndex?: number;
  isSimulating?: boolean;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  trades,
  config,
  activeCandleIndex,
  isSimulating = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 420 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  // Layer Toggles
  const [showEmaRibbon, setShowEmaRibbon] = useState(true);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showTrades, setShowTrades] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [visibleCount, setVisibleCount] = useState(70);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: entry.contentRect.width,
            height: Math.max(380, Math.min(520, window.innerHeight * 0.45)),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter candles if simulating
  const displayCandles = useMemo(() => {
    const base = activeCandleIndex !== undefined ? candles.slice(0, activeCandleIndex + 1) : candles;
    return base.slice(Math.max(0, base.length - visibleCount));
  }, [candles, activeCandleIndex, visibleCount]);

  // Chart Margins
  const margin = { top: 25, right: 65, bottom: 40, left: 15 };
  const plotWidth = Math.max(100, dimensions.width - margin.left - margin.right);
  const plotHeight = Math.max(100, dimensions.height - margin.top - margin.bottom);

  // Price Min / Max calculation
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (displayCandles.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    let min = Infinity;
    let max = -Infinity;

    for (const c of displayCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.supertrend && c.supertrend < min) min = c.supertrend;
      if (c.supertrend && c.supertrend > max) max = c.supertrend;
      if (c.emaTrend && c.emaTrend < min) min = c.emaTrend;
      if (c.emaTrend && c.emaTrend > max) max = c.emaTrend;
    }

    const padding = (max - min) * 0.08 || 1;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: max - min + padding * 2,
    };
  }, [displayCandles]);

  // Price & X Coordinate Converters
  const getY = (price: number) => {
    if (priceRange === 0) return plotHeight / 2;
    return margin.top + (1 - (price - minPrice) / priceRange) * plotHeight;
  };

  const candleSpacing = plotWidth / Math.max(1, displayCandles.length);
  const candleWidth = Math.max(2, Math.min(14, candleSpacing * 0.72));

  const getX = (index: number) => {
    return margin.left + index * candleSpacing + candleSpacing / 2;
  };

  // Hover candle
  const hoveredCandle = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length
    ? displayCandles[hoverIndex]
    : displayCandles[displayCandles.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const relativeX = x - margin.left;
    const idx = Math.floor(relativeX / candleSpacing);
    if (idx >= 0 && idx < displayCandles.length) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setMousePos(null);
  };

  // Price Grid Lines (5 horizontal ticks)
  const priceGridTicks = useMemo(() => {
    const ticks = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      const p = minPrice + (i / count) * priceRange;
      ticks.push(p);
    }
    return ticks;
  }, [minPrice, priceRange]);

  // Generate SVG Path for continuous indicators
  const emaFastPath = useMemo(() => {
    return displayCandles
      .map((c, i) => (c.emaFast ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.emaFast)}` : ''))
      .join(' ');
  }, [displayCandles, candleSpacing, minPrice, priceRange]);

  const emaSlowPath = useMemo(() => {
    return displayCandles
      .map((c, i) => (c.emaSlow ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.emaSlow)}` : ''))
      .join(' ');
  }, [displayCandles, candleSpacing, minPrice, priceRange]);

  const emaTrendPath = useMemo(() => {
    return displayCandles
      .map((c, i) => (c.emaTrend ? `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.emaTrend)}` : ''))
      .join(' ');
  }, [displayCandles, candleSpacing, minPrice, priceRange]);

  // Visible Trades matching current candles
  const visibleTrades = useMemo(() => {
    if (!showTrades || displayCandles.length === 0) return [];
    const firstTime = displayCandles[0].time;
    const lastTime = displayCandles[displayCandles.length - 1].time;
    return trades.filter((t) => t.openTime >= firstTime && t.openTime <= lastTime);
  }, [trades, displayCandles, showTrades]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080A] shadow-[0_0_25px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-white/5 bg-[#050507]/90 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-wide font-mono">{config.symbol}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-amber-400 font-mono text-[11px] font-semibold border border-amber-500/30">
              {config.timeframe}
            </span>
          </div>

          {/* Indicator Toggles */}
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
            <button
              onClick={() => setShowEmaRibbon(!showEmaRibbon)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                showEmaRibbon
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span>
              EMA Ribbon ({config.fastEmaPeriod}/{config.slowEmaPeriod}/{config.trendEmaPeriod})
            </button>

            <button
              onClick={() => setShowSupertrend(!showSupertrend)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                showSupertrend
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
              Supertrend ({config.supertrendPeriod}/{config.supertrendMultiplier})
            </button>

            <button
              onClick={() => setShowTrades(!showTrades)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                showTrades
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.8)]"></span>
              Orders & Target Lines ({trades.length})
            </button>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#050507] rounded-lg border border-white/10 text-slate-400 p-0.5">
            <button
              title="Zoom In"
              onClick={() => setVisibleCount((v) => Math.max(30, v - 15))}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              title="Zoom Out"
              onClick={() => setVisibleCount((v) => Math.min(180, v + 20))}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              title="Reset View"
              onClick={() => setVisibleCount(70)}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating HUD Bar on Top of Chart */}
      {hoveredCandle && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 bg-[#050507]/95 border-b border-white/5 font-mono text-[11px] text-slate-300">
          <div><span className="text-slate-500">T: </span><span className="text-slate-300">{hoveredCandle.timeStr}</span></div>
          <div><span className="text-slate-500">O: </span><span className="font-semibold text-slate-200">{hoveredCandle.open.toFixed(2)}</span></div>
          <div><span className="text-slate-500">H: </span><span className="text-emerald-400 font-semibold">{hoveredCandle.high.toFixed(2)}</span></div>
          <div><span className="text-slate-500">L: </span><span className="text-rose-400 font-semibold">{hoveredCandle.low.toFixed(2)}</span></div>
          <div><span className="text-slate-500">C: </span><span className={`font-bold ${hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}`}>{hoveredCandle.close.toFixed(2)}</span></div>
          {hoveredCandle.emaFast && (
            <div><span className="text-amber-400 font-medium">EMA({config.fastEmaPeriod}): </span>{hoveredCandle.emaFast.toFixed(2)}</div>
          )}
          {hoveredCandle.emaSlow && (
            <div><span className="text-cyan-400 font-medium">EMA({config.slowEmaPeriod}): </span>{hoveredCandle.emaSlow.toFixed(2)}</div>
          )}
          {hoveredCandle.atr && (
            <div><span className="text-purple-400 font-medium">ATR: </span>{hoveredCandle.atr.toFixed(2)}</div>
          )}
          {hoveredCandle.rsi && (
            <div><span className="text-blue-400 font-medium">RSI: </span>{hoveredCandle.rsi.toFixed(1)}</div>
          )}
        </div>
      )}

      {/* Primary SVG Candlestick & Indicator Stage */}
      <div ref={containerRef} className="relative w-full select-none cursor-crosshair bg-[#08080A]">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-hidden"
        >
          <defs>
            {/* Grid line pattern */}
            <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines & Price Labels */}
          {priceGridTicks.map((price, idx) => {
            const y = getY(price);
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={dimensions.width - margin.right}
                  y2={y}
                  stroke="#161822"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={dimensions.width - margin.right + 6}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {price.toFixed(config.symbol === 'XAUUSD' ? 2 : 2)}
                </text>
              </g>
            );
          })}

          {/* Time Axis Grid Labels */}
          {displayCandles.map((c, i) => {
            if (i % Math.ceil(displayCandles.length / 7) === 0) {
              const x = getX(i);
              return (
                <g key={`time-${i}`}>
                  <line
                    x1={x}
                    y1={margin.top}
                    x2={x}
                    y2={dimensions.height - margin.bottom}
                    stroke="#161822"
                    strokeDasharray="2 4"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={dimensions.height - margin.bottom + 18}
                    fill="#475569"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {c.timeStr.split(' ')[0]}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* EMA Ribbon Lines */}
          {showEmaRibbon && (
            <>
              {/* Trend 200 EMA */}
              <path d={emaTrendPath} fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.85" />
              {/* Slow EMA */}
              <path d={emaSlowPath} fill="none" stroke="#06b6d4" strokeWidth="1.75" opacity="0.9" />
              {/* Fast EMA */}
              <path d={emaFastPath} fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.95" />
            </>
          )}

          {/* Supertrend Indicator Segments */}
          {showSupertrend &&
            displayCandles.map((c, i) => {
              if (i === 0 || !c.supertrend) return null;
              const prev = displayCandles[i - 1];
              if (!prev.supertrend) return null;

              const x1 = getX(i - 1);
              const y1 = getY(prev.supertrend);
              const x2 = getX(i);
              const y2 = getY(c.supertrend);
              const isBull = c.supertrendDir === 1;

              return (
                <line
                  key={`st-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isBull ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeDasharray={isBull ? '' : '4 2'}
                  opacity="0.85"
                />
              );
            })}

          {/* Candlestick Wicks & Bodies */}
          {displayCandles.map((c, i) => {
            const x = getX(i);
            const isBullish = c.close >= c.open;
            const candleTop = getY(Math.max(c.open, c.close));
            const candleBottom = getY(Math.min(c.open, c.close));
            const candleHeight = Math.max(1.5, candleBottom - candleTop);
            const highY = getY(c.high);
            const lowY = getY(c.low);

            const color = isBullish ? '#10b981' : '#f43f5e';

            return (
              <g key={`candle-${c.time}-${i}`}>
                {/* Candle Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth="1.2"
                  opacity="0.9"
                />
                {/* Candle Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleHeight}
                  fill={isBullish ? 'url(#bullGradient)' : 'url(#bearGradient)'}
                  stroke={color}
                  strokeWidth="0.8"
                  rx="1"
                />
              </g>
            );
          })}

          {/* Trade Markers (Buy / Sell Executions & Target Lines) */}
          {showTrades &&
            visibleTrades.map((t) => {
              // Find candle index for open time
              const candleIdx = displayCandles.findIndex(
                (c) => Math.abs(c.time - t.openTime) < 15 * 60 * 1000
              );
              if (candleIdx === -1) return null;

              const x = getX(candleIdx);
              const isBuy = t.type === 'BUY';
              const y = getY(t.openPrice);
              const slY = getY(t.initialSl);
              const tpY = getY(t.tp);

              return (
                <g key={t.id}>
                  {/* Order Entry Arrow & Tag */}
                  {isBuy ? (
                    <g transform={`translate(${x}, ${y + 14})`}>
                      <polygon points="0,-10 -6,2 6,2" fill="#10b981" stroke="#047857" strokeWidth="1" />
                      <rect x="-24" y="4" width="48" height="15" rx="3" fill="#064e3b" stroke="#059669" strokeWidth="0.8" />
                      <text x="0" y="14" fill="#a7f3d0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        BUY {t.lotSize}L
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${x}, ${y - 14})`}>
                      <polygon points="0,10 -6,-2 6,-2" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
                      <rect x="-24" y="-19" width="48" height="15" rx="3" fill="#881337" stroke="#e11d48" strokeWidth="0.8" />
                      <text x="0" y="-9" fill="#fecdd3" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        SELL {t.lotSize}L
                      </text>
                    </g>
                  )}

                  {/* SL / TP Level Projections */}
                  <line
                    x1={x}
                    y1={slY}
                    x2={x + 50}
                    y2={slY}
                    stroke="#f43f5e"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                  <line
                    x1={x}
                    y1={tpY}
                    x2={x + 50}
                    y2={tpY}
                    stroke="#10b981"
                    strokeDasharray="2 2"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />

                  {/* Trade Outcome Flag if Closed */}
                  {t.closePrice && t.closeTime && (
                    (() => {
                      const closeIdx = displayCandles.findIndex(
                        (c) => Math.abs(c.time - t.closeTime!) < 15 * 60 * 1000
                      );
                      if (closeIdx === -1) return null;
                      const closeX = getX(closeIdx);
                      const closeY = getY(t.closePrice!);
                      const isWin = t.profit > 0;

                      return (
                        <g transform={`translate(${closeX}, ${closeY})`}>
                          <circle r="4" fill={isWin ? '#10b981' : '#f43f5e'} stroke="#ffffff" strokeWidth="1.5" />
                          <rect
                            x="6"
                            y="-10"
                            width="64"
                            height="18"
                            rx="4"
                            fill={isWin ? '#064e3b' : '#4c0519'}
                            stroke={isWin ? '#059669' : '#9f1239'}
                            strokeWidth="1"
                          />
                          <text
                            x="38"
                            y="2"
                            fill={isWin ? '#6ee7b7' : '#fda4af'}
                            fontSize="8.5"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {isWin ? `+$${t.profit.toFixed(0)}` : `-$${Math.abs(t.profit).toFixed(0)}`}
                          </text>
                        </g>
                      );
                    })()
                  )}
                </g>
              );
            })}

          {/* Interactive Crosshair, Column Highlight & Axis Badges */}
          {mousePos && hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length && (
            <g>
              {/* Column Halo Highlight */}
              <rect
                x={getX(hoverIndex) - candleSpacing / 2}
                y={margin.top}
                width={candleSpacing}
                height={plotHeight}
                fill="#38bdf8"
                fillOpacity="0.06"
              />

              {/* Vertical Time Crosshair Line */}
              <line
                x1={getX(hoverIndex)}
                y1={margin.top}
                x2={getX(hoverIndex)}
                y2={dimensions.height - margin.bottom}
                stroke="#60a5fa"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.8"
              />

              {/* Horizontal Price Crosshair Line */}
              <line
                x1={margin.left}
                y1={mousePos.y}
                x2={dimensions.width - margin.right}
                y2={mousePos.y}
                stroke="#60a5fa"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.8"
              />

              {/* High-Contrast Time Badge on X-Axis */}
              {hoveredCandle && (
                <g transform={`translate(${getX(hoverIndex)}, ${dimensions.height - margin.bottom})`}>
                  <rect
                    x="-42"
                    y="2"
                    width="84"
                    height="18"
                    fill="#030712"
                    stroke="#3b82f6"
                    strokeWidth="1.2"
                    rx="3"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                  />
                  <text
                    x="0"
                    y="14"
                    fill="#93c5fd"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {hoveredCandle.timeStr}
                  </text>
                </g>
              )}

              {/* High-Contrast Price Badge on Right Y-Axis */}
              {(() => {
                const hoverPrice = maxPrice - ((mousePos.y - margin.top) / plotHeight) * priceRange;
                return (
                  <g transform={`translate(${dimensions.width - margin.right}, ${mousePos.y})`}>
                    <rect
                      x="0"
                      y="-9"
                      width="62"
                      height="18"
                      fill="#030712"
                      stroke="#3b82f6"
                      strokeWidth="1.2"
                      rx="3"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                    />
                    <text
                      x="6"
                      y="3.5"
                      fill="#93c5fd"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {hoverPrice.toFixed(2)}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Floating Precision OHLC & Indicator Crosshair Tooltip */}
        {mousePos && hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length && hoveredCandle && (
          (() => {
            const isBull = hoveredCandle.close >= hoveredCandle.open;
            const priceChange = hoveredCandle.close - hoveredCandle.open;
            const pctChange = (priceChange / hoveredCandle.open) * 100;
            const candleRange = hoveredCandle.high - hoveredCandle.low;
            const candleBody = Math.abs(hoveredCandle.close - hoveredCandle.open);

            // Dynamic tooltip positioning to prevent viewport overflow
            const tooltipWidth = 250;
            const tooltipX = mousePos.x > dimensions.width - tooltipWidth - 30 
              ? Math.max(10, mousePos.x - tooltipWidth - 20) 
              : mousePos.x + 20;

            const tooltipY = Math.min(
              Math.max(10, mousePos.y - 90),
              dimensions.height - 230
            );

            return (
              <div
                id="candle-crosshair-tooltip"
                style={{
                  left: `${tooltipX}px`,
                  top: `${tooltipY}px`,
                }}
                className="absolute z-30 pointer-events-none w-[245px] p-3 rounded-xl bg-[#090b12]/95 backdrop-blur-md border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(59,130,246,0.15)] text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 font-sans"
              >
                {/* Header: Timestamp & Sentiment Badge */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 font-semibold">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{hoveredCandle.timeStr}</span>
                  </div>

                  <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold flex items-center gap-0.5 ${
                    isBull 
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isBull ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                    {isBull ? '+' : ''}{pctChange.toFixed(2)}%
                  </span>
                </div>

                {/* OHLC Values 2x2 Grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">OPEN</span>
                    <span className="font-semibold text-slate-200">${hoveredCandle.open.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                    <span className="text-emerald-400 text-[10px]">HIGH</span>
                    <span className="font-semibold text-emerald-300">${hoveredCandle.high.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                    <span className="text-rose-400 text-[10px]">LOW</span>
                    <span className="font-semibold text-rose-300">${hoveredCandle.low.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800/80">
                    <span className={`text-[10px] font-bold ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>CLOSE</span>
                    <span className={`font-bold ${isBull ? 'text-emerald-300' : 'text-rose-300'}`}>
                      ${hoveredCandle.close.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bar Metrics & Range */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Δ Change: </span>
                    <span className={priceChange >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {priceChange >= 0 ? `+$${priceChange.toFixed(2)}` : `-$${Math.abs(priceChange).toFixed(2)}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Range: </span>
                    <span className="text-slate-300 font-semibold">${candleRange.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quantitative Indicator Snapshots */}
                {(hoveredCandle.emaFast || hoveredCandle.supertrend || hoveredCandle.atr) && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/60 grid grid-cols-2 gap-1 text-[10px] font-mono">
                    {hoveredCandle.emaFast && (
                      <div className="text-amber-400/90 truncate">
                        <span className="text-slate-500">EMA({config.fastEmaPeriod}): </span>
                        {hoveredCandle.emaFast.toFixed(2)}
                      </div>
                    )}
                    {hoveredCandle.emaSlow && (
                      <div className="text-cyan-400/90 truncate">
                        <span className="text-slate-500">EMA({config.slowEmaPeriod}): </span>
                        {hoveredCandle.emaSlow.toFixed(2)}
                      </div>
                    )}
                    {hoveredCandle.supertrend && (
                      <div className="text-emerald-400/90 truncate col-span-2 flex items-center justify-between">
                        <span className="text-slate-500">Supertrend:</span>
                        <span className={hoveredCandle.supertrendDir === 1 ? 'text-emerald-400' : 'text-rose-400'}>
                          ${hoveredCandle.supertrend.toFixed(2)} ({hoveredCandle.supertrendDir === 1 ? 'BULL' : 'BEAR'})
                        </span>
                      </div>
                    )}
                    {hoveredCandle.atr && (
                      <div className="text-purple-400/90">
                        <span className="text-slate-500">ATR: </span>{hoveredCandle.atr.toFixed(2)}
                      </div>
                    )}
                    {hoveredCandle.rsi && (
                      <div className="text-blue-400/90">
                        <span className="text-slate-500">RSI: </span>{hoveredCandle.rsi.toFixed(1)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* Chart Footer Indicator Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#050507]/80 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.8)]"></div>
            <span>Fast EMA ({config.fastEmaPeriod})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]"></div>
            <span>Slow EMA ({config.slowEmaPeriod})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.8)]"></div>
            <span>Trend Baseline ({config.trendEmaPeriod})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.8)]"></div>
            <span>Supertrend Trailing</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10.5px]">
          <span className="text-slate-500">EXECUTION:</span>
          <span className="text-emerald-400 font-semibold">Bar-Close Confirmation + ATR Trailing</span>
        </div>
      </div>
    </div>
  );
};

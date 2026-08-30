import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AssetSymbol, MarketSentimentData, NewsSentimentItem } from '../types';
import { getMarketSentimentData } from '../services/marketSentimentService';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  X, 
  RefreshCw, 
  ShieldAlert, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Layers,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface MarketSentimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: AssetSymbol;
  onSelectSymbol: (symbol: AssetSymbol) => void;
}

export const MarketSentimentModal: React.FC<MarketSentimentModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  onSelectSymbol,
}) => {
  const [activeAsset, setActiveAsset] = useState<AssetSymbol>(currentSymbol === 'USOIL' ? 'USOIL' : 'XAUUSD');
  const [sentiment, setSentiment] = useState<MarketSentimentData>(() => getMarketSentimentData(activeAsset));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const mainGaugeRef = useRef<SVGSVGElement | null>(null);

  // Sync active asset when currentSymbol changes
  useEffect(() => {
    setActiveAsset(currentSymbol === 'USOIL' ? 'USOIL' : 'XAUUSD');
  }, [currentSymbol]);

  useEffect(() => {
    setSentiment(getMarketSentimentData(activeAsset));
  }, [activeAsset]);

  // Render Large D3 Radial Gauge
  useEffect(() => {
    if (!isOpen || !mainGaugeRef.current) return;
    const svg = d3.select(mainGaugeRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 150;
    const radius = 110;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height - 15})`);

    const startAngle = -Math.PI / 2;
    const endAngle = Math.PI / 2;

    const scale = d3.scaleLinear()
      .domain([-100, 100])
      .range([startAngle, endAngle])
      .clamp(true);

    // Background track arc
    const arcBg = d3.arc()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(4);

    g.append('path')
      .attr('d', arcBg as any)
      .attr('fill', '#1e293b');

    // 5 Colored Zones
    const zones = [
      { from: -100, to: -50, color: '#f43f5e', label: 'EXTREME BEARISH' },
      { from: -50, to: -15, color: '#fb7185', label: 'BEARISH' },
      { from: -15, to: 15, color: '#f59e0b', label: 'NEUTRAL' },
      { from: 15, to: 60, color: '#10b981', label: 'BULLISH' },
      { from: 60, to: 100, color: '#06b6d4', label: 'EXTREME BULLISH' },
    ];

    zones.forEach(zone => {
      const zStart = scale(zone.from);
      const zEnd = scale(zone.to);
      const zoneArc = d3.arc()
        .innerRadius(radius - 18)
        .outerRadius(radius)
        .startAngle(zStart)
        .endAngle(zEnd);

      g.append('path')
        .attr('d', zoneArc as any)
        .attr('fill', zone.color)
        .attr('opacity', 0.35);
    });

    // Active value arc
    const targetAngle = scale(sentiment.score);
    const valueArc = d3.arc()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(targetAngle)
      .cornerRadius(4);

    const activeColor = sentiment.score >= 60 ? '#06b6d4' : sentiment.score >= 15 ? '#10b981' : sentiment.score >= -15 ? '#f59e0b' : '#f43f5e';

    g.append('path')
      .attr('d', valueArc as any)
      .attr('fill', activeColor)
      .attr('filter', 'drop-shadow(0 0 8px rgba(6,182,212,0.6))');

    // Needle
    const needleLen = radius - 16;
    const needleAngle = targetAngle - Math.PI / 2;
    const needleX = needleLen * Math.cos(needleAngle);
    const needleY = needleLen * Math.sin(needleAngle);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', needleX)
      .attr('y2', needleY)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round');

    // Needle pivot
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 7)
      .attr('fill', '#ffffff')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.5);

    // Score Text Center
    g.append('text')
      .attr('x', 0)
      .attr('y', -32)
      .attr('text-anchor', 'middle')
      .attr('fill', activeColor)
      .attr('font-size', '28px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(sentiment.score > 0 ? `+${sentiment.score}` : `${sentiment.score}`);

    // Bias Label Center
    g.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(sentiment.bias.replace('_', ' '));

    // Gauge Min / Max labels
    g.append('text')
      .attr('x', -radius + 8)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f43f5e')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text('-100');

    g.append('text')
      .attr('x', 0)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text('0 (NEUTRAL)');

    g.append('text')
      .attr('x', radius - 8)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#06b6d4')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text('+100');

  }, [isOpen, sentiment, activeAsset]);

  if (!isOpen) return null;

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSentiment(getMarketSentimentData(activeAsset));
      setIsRefreshing(false);
    }, 600);
  };

  const filteredNews = sentiment.newsItems.filter(item => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#08080A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Global News Sentiment Impact Engine</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  REAL-TIME WIRE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional NLP news analytics gauging macroeconomic, geopolitical, and supply catalysts for Gold & Crude Oil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshFeed}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:text-amber-400 transition"
              title="Rescan global news wires"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Commodity Asset Selector Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveAsset('XAUUSD');
                  onSelectSymbol('XAUUSD');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeAsset === 'XAUUSD'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>XAUUSD (Spot Gold)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20">+76 Bullish</span>
              </button>

              <button
                onClick={() => {
                  setActiveAsset('USOIL');
                  onSelectSymbol('USOIL');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeAsset === 'USOIL'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-300"></span>
                <span>USOIL (WTI Crude)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20">+46 Bullish</span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2 px-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Wire Latency: ~180ms</span>
            </div>
          </div>

          {/* MAIN GAUGE & SENTIMENT BREAKDOWN HERO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-gradient-to-br from-slate-950 via-[#0a0c12] to-slate-950 p-6 rounded-2xl border border-slate-800/80 shadow-xl">
            {/* D3 Gauge Center Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>COMPOSITE SENTIMENT GAUGE</span>
              </span>

              <svg ref={mainGaugeRef} className="w-full max-w-[280px] h-40 my-1" />

              <div className="mt-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Estimated Price Impact: {sentiment.estimatedPriceImpact}
              </div>
            </div>

            {/* Sentiment Consensus Distribution & Drivers */}
            <div className="lg:col-span-7 space-y-4">
              {/* Bull / Bear Distribution Bar */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Bullish ({sentiment.bullishPercentage}%)
                  </span>
                  <span className="text-slate-400">Neutral ({sentiment.neutralPercentage}%)</span>
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> Bearish ({sentiment.bearishPercentage}%)
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${sentiment.bullishPercentage}%` }} 
                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-500"
                  />
                  <div 
                    style={{ width: `${sentiment.neutralPercentage}%` }} 
                    className="bg-amber-500/70 h-full transition-all duration-500"
                  />
                  <div 
                    style={{ width: `${sentiment.bearishPercentage}%` }} 
                    className="bg-rose-500 h-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* 4 Quantitative Sentiment Driver Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">Geopolitical Risk</span>
                  <span className="text-sm font-bold font-mono text-rose-400 mt-0.5 block">
                    {sentiment.geopoliticalRiskScore}/100
                  </span>
                  <span className="text-[9.5px] text-slate-500">Safe-Haven Bid</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">Fed & Real Yields</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                    +{sentiment.monetaryPolicyScore}
                  </span>
                  <span className="text-[9.5px] text-slate-500">Dovish Easing</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">Supply / Demand</span>
                  <span className="text-sm font-bold font-mono text-cyan-400 mt-0.5 block">
                    +{sentiment.physicalSupplyDemandScore}
                  </span>
                  <span className="text-[9.5px] text-slate-500">Tight Physical</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">DXY Correlation</span>
                  <span className="text-sm font-bold font-mono text-amber-300 mt-0.5 block">
                    +{sentiment.dollarIndexImpactScore}
                  </span>
                  <span className="text-[9.5px] text-slate-500">Dollar Softening</span>
                </div>
              </div>

              {/* Actionable Strategy Advice Callout */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-300">Algo Execution Guidance:</span>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    {sentiment.actionableRecommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE NEWS WIRE FEED & NLP CLASSIFICATION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>LIVE GLOBAL NEWS STREAM & IMPACT SCORES ({activeAsset})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Classified by institutional NLP models weighting price velocity, headline sentiment, and volumetric impact
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                {['ALL', 'CENTRAL_BANK', 'GEOPOLITICAL', 'SUPPLY_DEMAND', 'INVENTORY'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      filterCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* News Item Cards */}
            <div className="space-y-3">
              {filteredNews.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900/80 border border-slate-800/90 transition-all space-y-2 group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.source}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {item.timestamp}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                        item.impactLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : item.impactLevel === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.impactLevel} IMPACT
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                        item.sentimentScore >= 60
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : item.sentimentScore >= 20
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {item.sentimentScore > 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        Score: {item.sentimentScore > 0 ? `+${item.sentimentScore}` : item.sentimentScore} ({item.bias.replace('_', ' ')})
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {item.headline}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs font-mono text-slate-400">
          <span>Global News Sentinel v2.4 • Gemini AI Market Sentiment</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer"
          >
            Close Sentiment View
          </button>
        </div>
      </div>
    </div>
  );
};

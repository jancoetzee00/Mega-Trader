import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AssetSymbol, MarketSentimentData } from '../types';
import { getMarketSentimentData } from '../services/marketSentimentService';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Radio, 
  ChevronRight, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface MarketSentimentHeaderGaugeProps {
  currentSymbol: AssetSymbol;
  onOpenModal: () => void;
}

export const MarketSentimentHeaderGauge: React.FC<MarketSentimentHeaderGaugeProps> = ({
  currentSymbol,
  onOpenModal,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [sentiment, setSentiment] = useState<MarketSentimentData>(() => getMarketSentimentData(currentSymbol));

  useEffect(() => {
    setSentiment(getMarketSentimentData(currentSymbol));
  }, [currentSymbol]);

  // Render compact D3 Mini Gauge
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 64;
    const height = 36;
    const radius = 26;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height - 4})`);

    const startAngle = -Math.PI / 2;
    const endAngle = Math.PI / 2;

    // Scale from -100 (Extreme Bearish) to +100 (Extreme Bullish)
    const scale = d3.scaleLinear()
      .domain([-100, 100])
      .range([startAngle, endAngle])
      .clamp(true);

    // Background track arc
    const arcBg = d3.arc()
      .innerRadius(radius - 5)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .cornerRadius(2);

    g.append('path')
      .attr('d', arcBg as any)
      .attr('fill', '#1e293b');

    // Colored gradient zones
    const zones = [
      { from: -100, to: -30, color: '#f43f5e' }, // Rose (Bearish)
      { from: -30, to: 25, color: '#f59e0b' },   // Amber (Neutral)
      { from: 25, to: 70, color: '#10b981' },    // Emerald (Bullish)
      { from: 70, to: 100, color: '#06b6d4' },   // Cyan (Extreme Bullish)
    ];

    zones.forEach(zone => {
      const zStart = scale(zone.from);
      const zEnd = scale(zone.to);
      const zoneArc = d3.arc()
        .innerRadius(radius - 5)
        .outerRadius(radius)
        .startAngle(zStart)
        .endAngle(zEnd);

      g.append('path')
        .attr('d', zoneArc as any)
        .attr('fill', zone.color)
        .attr('opacity', 0.4);
    });

    // Active value arc
    const targetAngle = scale(sentiment.score);
    const valueArc = d3.arc()
      .innerRadius(radius - 5)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(targetAngle)
      .cornerRadius(2);

    const activeColor = sentiment.score >= 70 ? '#06b6d4' : sentiment.score >= 25 ? '#10b981' : sentiment.score >= -30 ? '#f59e0b' : '#f43f5e';

    g.append('path')
      .attr('d', valueArc as any)
      .attr('fill', activeColor)
      .attr('filter', 'drop-shadow(0 0 3px rgba(16,185,129,0.6))');

    // Needle
    const needleLen = radius - 7;
    const needleAngle = targetAngle - Math.PI / 2;
    const needleX = needleLen * Math.cos(needleAngle);
    const needleY = needleLen * Math.sin(needleAngle);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', needleX)
      .attr('y2', needleY)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.8)
      .attr('stroke-linecap', 'round');

    // Pivot center dot
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 2.5)
      .attr('fill', '#ffffff');

  }, [sentiment]);

  const isBullish = sentiment.score > 0;
  const isExtreme = Math.abs(sentiment.score) >= 70;

  return (
    <button
      id="market-sentiment-header-btn"
      onClick={onOpenModal}
      className="group flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-[#090b10] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-all shadow-sm active:scale-98 cursor-pointer"
      title="Click to view Global News Sentiment Impact & Breakdown"
    >
      {/* Mini D3 Gauge */}
      <div className="relative flex flex-col items-center justify-center shrink-0">
        <svg ref={svgRef} className="w-12 h-7" />
        <span className={`text-[9.5px] font-mono font-bold leading-none -mt-1 ${
          isExtreme ? (isBullish ? 'text-cyan-400' : 'text-rose-400') : isBullish ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {sentiment.score > 0 ? `+${sentiment.score}` : sentiment.score}
        </span>
      </div>

      {/* Sentiment Information Text */}
      <div className="flex flex-col min-w-0 pr-1">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-amber-400" />
            <span>NEWS SENTIMENT</span>
          </span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-xs font-bold font-mono ${
            sentiment.score >= 70 
              ? 'text-cyan-300' 
              : sentiment.score >= 25 
              ? 'text-emerald-300' 
              : sentiment.score >= -30 
              ? 'text-amber-300' 
              : 'text-rose-400'
          }`}>
            {sentiment.symbol === 'XAUUSD' ? 'GOLD' : 'OIL'}: {sentiment.bias.replace('_', ' ')}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </button>
  );
};

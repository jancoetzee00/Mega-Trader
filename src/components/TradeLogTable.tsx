import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { Download, Filter, Search, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

interface TradeLogTableProps {
  trades: Trade[];
}

export const TradeLogTable: React.FC<TradeLogTableProps> = ({ trades }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'WIN' | 'LOSS' | 'BUY' | 'SELL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Type Filter
      if (filterType === 'WIN' && t.profit <= 0) return false;
      if (filterType === 'LOSS' && t.profit > 0) return false;
      if (filterType === 'BUY' && t.type !== 'BUY') return false;
      if (filterType === 'SELL' && t.type !== 'SELL') return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTicket = t.ticket.toString().includes(q);
        const matchSymbol = t.symbol.toLowerCase().includes(q);
        const matchReason = t.exitReason?.toLowerCase().includes(q) || false;
        return matchTicket || matchSymbol || matchReason;
      }

      return true;
    });
  }, [trades, filterType, searchQuery]);

  // Export to CSV
  const exportToCsv = () => {
    if (trades.length === 0) return;
    const headers = ['Ticket', 'Symbol', 'Type', 'Open Time', 'Close Time', 'Open Price', 'Close Price', 'Lots', 'SL', 'TP', 'PnL ($)', 'Pips', 'Exit Reason'];
    const rows = trades.map((t) => [
      t.ticket,
      t.symbol,
      t.type,
      t.openTimeStr,
      t.closeTimeStr || 'Open',
      t.openPrice,
      t.closePrice || '',
      t.lotSize,
      t.initialSl,
      t.tp,
      t.profit,
      t.pips,
      `"${t.exitReason || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MT5_Commodity_Trade_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080A] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-white/5 bg-[#050507]/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">TRADE EXECUTION JOURNAL & AUDIT</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono border border-white/5">
            {filteredTrades.length} / {trades.length} Trades
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Filter */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter ticket, symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-[#050507] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center bg-[#050507] rounded-lg border border-white/10 p-0.5 text-xs font-mono">
            {(['ALL', 'WIN', 'LOSS', 'BUY', 'SELL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-2.5 py-1 rounded transition ${
                  filterType === f
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* CSV Download */}
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono font-semibold border border-white/10 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>CSV EXPORT</span>
          </button>
        </div>
      </div>

      {/* Trades Table Content */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-[#050507] text-slate-500 uppercase tracking-wider text-[10px] border-b border-white/10 font-mono">
            <tr>
              <th className="px-4 py-2.5">Ticket</th>
              <th className="px-3 py-2.5">Symbol</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Open Time</th>
              <th className="px-3 py-2.5">Close Time</th>
              <th className="px-3 py-2.5">Lots</th>
              <th className="px-3 py-2.5">Entry</th>
              <th className="px-3 py-2.5">Close</th>
              <th className="px-3 py-2.5">TP / SL</th>
              <th className="px-3 py-2.5 text-right">Profit ($)</th>
              <th className="px-4 py-2.5 text-right">Exit Trigger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-slate-500 font-mono">
                  No trade executions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredTrades.map((t) => {
                const isWin = t.profit > 0;
                const isBuy = t.type === 'BUY';

                return (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition">
                    <td className="px-4 py-2 font-bold text-slate-500">#{t.ticket}</td>
                    <td className="px-3 py-2 font-bold text-white">{t.symbol}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{t.openTimeStr}</td>
                    <td className="px-3 py-2 text-slate-400">{t.closeTimeStr || 'Running'}</td>
                    <td className="px-3 py-2 font-semibold text-slate-200">{t.lotSize.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-200">${t.openPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-200">${t.closePrice ? t.closePrice.toFixed(2) : '-'}</td>
                    <td className="px-3 py-2 text-[11px]">
                      <span className="text-emerald-400 font-semibold">{t.tp.toFixed(2)}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-rose-400 font-semibold">{t.initialSl.toFixed(2)}</span>
                    </td>
                    <td className={`px-3 py-2 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}${t.profit.toFixed(2)}
                      <div className="text-[9.5px] font-normal text-slate-500 font-mono">{t.pips > 0 ? `+${t.pips}` : t.pips} pts</div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-medium ${
                          t.status === 'CLOSED_TP'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : t.status === 'CLOSED_TRAILING'
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {t.status === 'CLOSED_TP' && <CheckCircle className="h-3 w-3 text-emerald-400" />}
                        {t.status === 'CLOSED_TRAILING' && <ShieldCheck className="h-3 w-3 text-cyan-400" />}
                        {t.status === 'CLOSED_SL' && <XCircle className="h-3 w-3 text-rose-400" />}
                        {t.status === 'CLOSED_TP' ? 'Take Profit' : t.status === 'CLOSED_TRAILING' ? 'Trailing Stop' : 'Stop Loss'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

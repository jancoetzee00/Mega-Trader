import React, { useState } from 'react';
import { StrategyConfig } from '../types';
import { generateMql5Code } from '../services/mql5Generator';
import { generatePythonMt5Code } from '../services/pythonGenerator';
import { Copy, Check, Download, FileCode, Terminal, HelpCircle, Shield, Zap, Sparkles } from 'lucide-react';

interface Mql5CodePanelProps {
  config: StrategyConfig;
}

export const Mql5CodePanel: React.FC<Mql5CodePanelProps> = ({ config }) => {
  const [activeLang, setActiveLang] = useState<'MQL5' | 'PYTHON'>('MQL5');
  const [copied, setCopied] = useState(false);

  const mql5Code = generateMql5Code(config);
  const pythonCode = generatePythonMt5Code(config);
  const currentCode = activeLang === 'MQL5' ? mql5Code : pythonCode;
  const fileName = activeLang === 'MQL5'
    ? `${config.name.replace(/[^a-zA-Z0-9_]/g, '')}.mq5`
    : `mt5_${config.symbol.toLowerCase()}_bot.py`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Code Header & Switcher */}
      <div className="rounded-xl border border-white/10 bg-[#08080A] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-[#050507]/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#050507] rounded-lg border border-white/10 p-1 font-mono">
              <button
                id="btn-mql5-lang"
                onClick={() => setActiveLang('MQL5')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                  activeLang === 'MQL5'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="h-4 w-4" />
                MQL5 EXPERT ADVISOR (.mq5)
              </button>

              <button
                id="btn-python-lang"
                onClick={() => setActiveLang('PYTHON')}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition ${
                  activeLang === 'PYTHON'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="h-4 w-4" />
                PYTHON MT5 BRIDGE (.py)
              </button>
            </div>

            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              {activeLang === 'MQL5' ? 'MetaQuotes MQL5 v2.40 (Compiled with F7)' : 'Python 3.10+ MetaTrader5 API'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono font-semibold border border-white/10 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}</span>
            </button>

            <button
              id="download-source-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)] transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>DOWNLOAD {fileName.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Code Viewer Stage */}
        <div className="relative p-4 bg-[#050507] overflow-x-auto max-h-[560px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed selection:bg-amber-500/30 selection:text-amber-200">
          <pre className="tab-4">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Code Highlights Footer */}
        <div className="p-3 bg-[#050507]/90 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pip/Tick Normalizer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>ATR Position Sizer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Trailing Stop & HUD</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            MT5 Build 4000+ / MetaEditor 5
          </div>
        </div>
      </div>
    </div>
  );
};

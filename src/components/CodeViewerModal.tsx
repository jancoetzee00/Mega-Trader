import React, { useState } from 'react';
import { StrategyConfig } from '../types';
import { generateMql5Code } from '../services/mql5Generator';
import { generatePythonMt5Code } from '../services/pythonGenerator';
import { X, Copy, Check, Download, FileCode, Terminal, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StrategyConfig;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose, config }) => {
  const [lang, setLang] = useState<'MQL5' | 'PYTHON'>('MQL5');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const mql5Code = generateMql5Code(config);
  const pythonCode = generatePythonMt5Code(config);
  const currentCode = lang === 'MQL5' ? mql5Code : pythonCode;
  const fileName = lang === 'MQL5'
    ? `${config.name.replace(/[^a-zA-Z0-9_]/g, '')}.mq5`
    : `mt5_${config.symbol.toLowerCase()}_bot.py`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.85 } });
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
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-xl bg-[#08080A] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/5 bg-[#050507] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <span>EXPORT MT5 ALGORITHM CODE</span>
                <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  READY TO COMPILE
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <div className="flex items-center bg-[#050507] p-0.5 rounded-lg border border-white/10 text-xs font-mono font-semibold">
              <button
                onClick={() => setLang('MQL5')}
                className={`px-2.5 py-1 rounded transition ${
                  lang === 'MQL5' ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                MQL5 (.mq5)
              </button>
              <button
                onClick={() => setLang('PYTHON')}
                className={`px-2.5 py-1 rounded transition ${
                  lang === 'PYTHON' ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Python (.py)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 bg-[#050507] overflow-y-auto font-mono text-xs text-slate-300 select-text leading-relaxed">
          <pre>
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-[#050507] flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="text-xs text-slate-500">
            {lang === 'MQL5' ? 'Paste into MetaEditor 5 and press F7 to compile' : 'Run via python with MetaTrader5 package'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'COPIED' : 'COPY CODE'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] transition active:scale-95"
            >
              <Download className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>DOWNLOAD {fileName.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

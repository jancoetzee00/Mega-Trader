import React, { useState } from 'react';
import { BookOpen, CheckCircle, Download, ExternalLink, Terminal, Shield, AlertTriangle, Monitor, Cpu } from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      step: 1,
      title: 'Save Source Code in MT5 Experts Directory',
      badge: 'File System',
      description: 'Download the generated `.mq5` Expert Advisor file from this dashboard or copy the code.',
      instructions: [
        'Open MetaTrader 5 on your PC / VPS.',
        'Click File > Open Data Folder in the top menu bar.',
        'Navigate to: MQL5 > Experts > Advisors.',
        'Paste or save your file there (e.g. AuraBreak_Gold.mq5 or PetroPulse_Oil.mq5).',
      ],
    },
    {
      step: 2,
      title: 'Compile with MetaEditor 5 (Zero Errors)',
      badge: 'MetaEditor (F4)',
      description: 'Compile the MQL5 source code into binary machine code (`.ex5`) executable.',
      instructions: [
        'Press F4 in MT5 (or click the MetaEditor IDE icon in the toolbar).',
        'In the left Navigator panel, expand Experts > Advisors and double-click your EA file.',
        'Press F7 (or click the green "Compile" button at the top).',
        'Check the "Errors" tab at the bottom. You should see "0 errors, 0 warnings". An .ex5 file is now generated.',
      ],
    },
    {
      step: 3,
      title: 'Enable Automated Algo Trading & Permissions',
      badge: 'Terminal Permissions',
      description: 'Grant MT5 permission to execute live algorithmic trades.',
      instructions: [
        'In the main MT5 terminal, click the "Algo Trading" button in the top toolbar so it turns green.',
        'Go to Tools > Options > Expert Advisors tab.',
        'Check: "Allow Algo Trading".',
        'Optional for webhooks: Check "Allow WebRequest for listed URL" if sending Discord/Telegram trade alerts.',
      ],
    },
    {
      step: 4,
      title: 'Attach EA to Chart & Tune Input Parameters',
      badge: 'Chart Execution',
      description: 'Attach the EA to a Gold (XAUUSD) or Crude Oil (USOIL/XTIUSD) chart.',
      instructions: [
        'Open a chart for XAUUSD (Gold) or USOIL (Crude Oil) and set the timeframe to M15 (15 Minutes) or H1.',
        'In the Navigator window (Ctrl+N), drag your EA from Expert Advisors onto the chart.',
        'In the popup window, go to the "Common" tab and check "Allow Algo Trading".',
        'Go to the "Inputs" tab to customize your Risk % (e.g. 1.0%), Magic Number, and Time Filters.',
        'Click OK. You will see the Live HUD dashboard appear on the chart with a smiling blue hat in the top right corner.',
      ],
    },
    {
      step: 5,
      title: 'Commodity Specific Execution & VPS Best Practices',
      badge: 'Institutional Tips',
      description: 'Key volatility rules for trading Gold and Crude Oil profitably.',
      instructions: [
        'Gold (XAUUSD): Avoid entries during low-liquidity Asian rollover (21:00 - 23:00 GMT) due to wide spreads.',
        'Crude Oil (USOIL): High volatility occurs on Wednesdays at 14:30 GMT during US EIA Petroleum Status Reports.',
        'Low-Latency VPS: Run MT5 on a Windows VPS close to your broker’s London or New York server for sub-5ms execution.',
        'Tick Value Verification: Ensure your broker uses standard 100 oz per lot for Gold and 1,000 bbl per lot for Oil.',
      ],
    },
    {
      step: 6,
      title: 'Zero-Trust MT5 VPN Tunnel Cross-Connect',
      badge: 'WireGuard / TLS',
      description: 'Establish point-to-point encrypted tunnel between AI Web App and MT5 VPS.',
      instructions: [
        'Open the "MT5 VPN Tunnel" tab in this dashboard.',
        'Download the pre-configured `wg0-mt5-client.conf` file.',
        'Install WireGuard on Windows VPS (wireguard.com) and click Add Tunnel -> Activate.',
        'In MT5: Tools -> Options -> Expert Advisors, allow WebRequest to `http://10.66.77.1:3000`.',
        'Verify sub-2ms ping in the Datacenter Latency Diagnostics matrix (Equinix LD4 / NY4).',
      ],
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#08080A] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Guide Header */}
      <div className="p-4 border-b border-white/5 bg-[#050507]/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">MetaTrader 5 Expert Advisor Deployment Manual</h3>
        </div>
        <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          MT5 Compatible (Build 3800+)
        </span>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Selector List */}
        <div className="space-y-2">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                activeStep === s.step
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                  : 'bg-[#050507]/80 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                  activeStep === s.step ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {s.step}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{s.title}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{s.badge}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Step Detail Card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#050507]/90 border border-white/10 flex flex-col justify-between shadow-inner">
          <div>
            {(() => {
              const current = steps.find((s) => s.step === activeStep)!;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                      Step {current.step} of {steps.length} • {current.badge}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-xs font-mono border border-white/5">
                      Est. Setup: ~3 mins
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">{current.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{current.description}</p>

                  {/* Instructions Bullet Points */}
                  <div className="space-y-2.5 pt-2">
                    {current.instructions.map((ins, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between font-mono">
            <button
              onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
              disabled={activeStep === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 border border-white/10 transition"
            >
              PREVIOUS STEP
            </button>

            <button
              onClick={() => setActiveStep((p) => Math.min(5, p + 1))}
              disabled={activeStep === 5}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(245,158,11,0.25)] transition"
            >
              NEXT STEP &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

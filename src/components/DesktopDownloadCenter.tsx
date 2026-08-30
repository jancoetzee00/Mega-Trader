import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  FolderArchive,
  CheckCircle2,
  Copy,
  Check,
  FileCode,
  Globe,
  Sparkles,
  ExternalLink,
  Laptop,
  ArrowRight,
  Shield,
  Zap,
  Play
} from 'lucide-react';
import { StrategyConfig, VPNTunnelConfig } from '../types';
import {
  generateFullDesktopSuiteZip,
  generateWindowsLauncherBat,
  generatePowerShellShortcutScript,
  generateUnixLauncherSh,
  generateDesktopReadme,
  triggerBlobDownload,
  triggerTextDownload
} from '../services/desktopPackageService';
import { generateMql5Code } from '../services/mql5Generator';
import { generatePythonMt5Code } from '../services/pythonGenerator';
import { generateWireGuardConfigFile, generatePythonMT5Daemon, generateMQL5WebRequestEA } from '../services/vpnTunnelService';

interface DesktopDownloadCenterProps {
  config: StrategyConfig;
  vpnConfig?: VPNTunnelConfig;
}

export const DesktopDownloadCenter: React.FC<DesktopDownloadCenterProps> = ({ config, vpnConfig }) => {
  const [isBundling, setIsBundling] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<'windows' | 'mac' | 'linux' | 'mt5_ea'>('windows');

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ai.studio/build';

  const handleDownloadFullSuite = async () => {
    setIsBundling(true);
    setDownloadSuccess(false);
    try {
      const blob = await generateFullDesktopSuiteZip({
        config,
        vpnConfig,
        appUrl: appOrigin,
      });
      triggerBlobDownload(blob, `Quantum_AI_MT5_Desktop_Suite_${config.symbol}.zip`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Error generating desktop bundle:', err);
    } finally {
      setIsBundling(false);
    }
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION: 1-CLICK COMPLETE DESKTOP SUITE DOWNLOAD */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-950 p-6 lg:p-8 shadow-xl shadow-emerald-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                OFFICIAL DESKTOP CLIENT SUITE v3.7
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                WINDOWS • MACOS • LINUX
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Download Quantum AI for Desktop & MetaTrader 5
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Get the standalone desktop application package. Includes the dedicated desktop launcher, MQL5 Expert Advisors for Gold & Crude Oil, Zero-Trust MT5 Python Bridge, and WireGuard VPN tunnel configurations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Windows Shortcut Setup
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <ShieldCheck className="w-3.5 h-3.5" /> WireGuard Encrypted Bridge
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3.5 h-3.5" /> Direct MT5 IPC Connection
              </span>
            </div>
          </div>

          {/* Primary Action Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[280px]">
            <button
              id="btn-download-full-suite"
              onClick={handleDownloadFullSuite}
              disabled={isBundling}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isBundling ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Packaging Desktop Suite...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-slate-950 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Download Desktop Suite (.ZIP)</span>
                </>
              )}
            </button>

            {downloadSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Downloaded! Unzip and run Launch-Desktop-App.bat</span>
              </div>
            )}

            <div className="text-[11px] text-center text-slate-400">
              Includes <code className="text-slate-300 font-mono">Launch-Desktop-App.bat</code>, <code className="text-slate-300 font-mono">Setup-Desktop-Shortcut.ps1</code>, and MT5 EAs
            </div>
          </div>
        </div>
      </div>

      {/* 2. PLATFORM TABS & DETAILED DOWNLOAD OPTIONS */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-emerald-400" />
              <span>Modular Desktop Packages & Individual Scripts</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Download individual standalone launchers, MQL5 algorithms, or platform-specific installers.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActivePlatform('windows')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePlatform === 'windows'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Windows
            </button>
            <button
              onClick={() => setActivePlatform('mac')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePlatform === 'mac'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> macOS
            </button>
            <button
              onClick={() => setActivePlatform('linux')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePlatform === 'linux'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Linux
            </button>
            <button
              onClick={() => setActivePlatform('mt5_ea')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePlatform === 'mt5_ea'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> MT5 EAs
            </button>
          </div>
        </div>

        {/* WINDOWS TAB */}
        {activePlatform === 'windows' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Windows 1-Click Batch Launcher */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Windows Launcher</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">.BAT</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Launch-Desktop-App.bat
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Launches the Quantum AI Trading Workspace in a clean, dedicated native desktop app window without browser tabs or address bar clutter.
                </p>
              </div>

              <button
                onClick={() => triggerTextDownload(generateWindowsLauncherBat(appOrigin), 'Launch-Desktop-App.bat', 'text/plain')}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-emerald-500"
              >
                <Download className="w-4 h-4" />
                <span>Download .BAT Launcher</span>
              </button>
            </div>

            {/* PowerShell Shortcut Creator */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Desktop Shortcut</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">.PS1</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Setup-Desktop-Shortcut.ps1
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically pins a custom "Quantum AI MT5 Terminal" shortcut to your Windows Desktop and Start Menu.
                </p>
              </div>

              <button
                onClick={() => triggerTextDownload(generatePowerShellShortcutScript(appOrigin), 'Setup-Desktop-Shortcut.ps1', 'text/plain')}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-cyan-500"
              >
                <Download className="w-4 h-4" />
                <span>Download .PS1 Installer</span>
              </button>
            </div>

            {/* Python MT5 IPC Bridge Daemon */}
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">MT5 IPC Bridge</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">.PY + .BAT</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Python MT5 Daemon & Runner
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Low-latency inter-process communication bridge that routes AI signals directly into local MetaTrader 5 with sub-millisecond fills.
                </p>
              </div>

              <button
                onClick={() => {
                  const vpn = vpnConfig || {
                    protocol: 'WIREGUARD',
                    serverEndpoint: 'vpn.quantum-mt5.io',
                    serverPort: 51820,
                    clientTunnelIP: '10.66.77.2/32',
                    serverTunnelIP: '10.66.77.1/24',
                    dnsServer: '1.1.1.1, 8.8.8.8',
                    allowedIPs: '0.0.0.0/0, ::/0',
                    persistentKeepalive: 15,
                    clientPrivateKey: 'yAn8K3mG9q+VfT7uBx1Zw9L0pRe5t6Yu3i2o1pA4s=',
                    clientPublicKey: 'oP8q7r6s5t4u3v2w1x0yZ9A8B7C6D5E4F3G2H1I=',
                    serverPublicKey: 'sE8r7v6e5r4P3u2b1l0i9cK8e7y6V5a4l3u2e1==',
                    presharedKey: 'kL9m8N7b6V5c4X3z2A1s0D9f8G7h6J5k4L3m2N1=',
                    authSecretToken: 'mt5_sec_9948a7fbc231908e41de7a',
                    encryptionCipher: 'ChaCha20-Poly1305 (256-bit AEAD)',
                    mtu: 1420,
                    killSwitchEnabled: true,
                    targetBroker: 'IC Markets / Pepperstone (Raw ECN)',
                    vpsDatacenter: 'Equinix LD4 (London, UK)',
                  };
                  triggerTextDownload(generatePythonMT5Daemon(vpn), 'mt5_secure_tunnel.py', 'text/x-python');
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-amber-500"
              >
                <Download className="w-4 h-4" />
                <span>Download Python Bridge</span>
              </button>
            </div>
          </div>
        )}

        {/* MACOS TAB */}
        {activePlatform === 'mac' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">macOS Terminal Launcher</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">.SH</span>
                </div>
                <h3 className="text-base font-bold text-white">Launch-Desktop-App.sh</h3>
                <p className="text-xs text-slate-400">
                  Shell script that launches Quantum AI in a dedicated application window via Google Chrome or Safari.
                </p>
                <button
                  onClick={() => triggerTextDownload(generateUnixLauncherSh(appOrigin), 'Launch-Desktop-App.sh', 'application/x-sh')}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-emerald-500"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .SH Script</span>
                </button>
              </div>

              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">macOS PWA Web App</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">SAFARI / CHROME</span>
                </div>
                <h3 className="text-base font-bold text-white">Add to Dock / Install Web App</h3>
                <p className="text-xs text-slate-400">
                  In Safari: Click <strong>File → Add to Dock</strong>. In Chrome: Click the <strong>Install App</strong> icon in the address bar to add to Applications folder.
                </p>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-emerald-400 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Native macOS Dock integration supported</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LINUX TAB */}
        {activePlatform === 'linux' && (
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400">Linux Desktop Launcher & .desktop Entry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">BASH / .DESKTOP</span>
            </div>
            <h3 className="text-base font-bold text-white">Launch-Desktop-App.sh</h3>
            <p className="text-xs text-slate-400">
              Run this script on Ubuntu, Debian, Fedora, or Arch Linux. Compatible with Chromium app mode and wine/MT5 setups.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => triggerTextDownload(generateUnixLauncherSh(appOrigin), 'Launch-Desktop-App.sh', 'application/x-sh')}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-emerald-500"
              >
                <Download className="w-4 h-4" />
                <span>Download Launch-Desktop-App.sh</span>
              </button>
            </div>
          </div>
        )}

        {/* MT5 EA TAB */}
        {activePlatform === 'mt5_ea' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">Primary Trading EA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">.MQ5</span>
              </div>
              <h3 className="text-base font-bold text-white">Quantum_AI_AuraBreak.mq5</h3>
              <p className="text-xs text-slate-400">
                Institutional algorithm with EMA Ribbon, Supertrend, ATR Trailing Stops, Break-Even automation, and spread filters.
              </p>
              <button
                onClick={() => triggerTextDownload(generateMql5Code(config), `Quantum_AI_AuraBreak_${config.symbol}.mq5`, 'text/plain')}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Primary EA (.MQ5)</span>
              </button>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">Zero-Trust WebRequest EA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">.MQ5</span>
              </div>
              <h3 className="text-base font-bold text-white">Quantum_VPN_Bridge_EA.mq5</h3>
              <p className="text-xs text-slate-400">
                Lightweight bridge EA that queries the AI Watcher over encrypted WireGuard tunnel and triggers local MT5 order execution.
              </p>
              <button
                onClick={() => {
                  const vpn = vpnConfig || {
                    protocol: 'WIREGUARD',
                    serverEndpoint: 'vpn.quantum-mt5.io',
                    serverPort: 51820,
                    clientTunnelIP: '10.66.77.2/32',
                    serverTunnelIP: '10.66.77.1/24',
                    dnsServer: '1.1.1.1, 8.8.8.8',
                    allowedIPs: '0.0.0.0/0, ::/0',
                    persistentKeepalive: 15,
                    clientPrivateKey: 'yAn8K3mG9q+VfT7uBx1Zw9L0pRe5t6Yu3i2o1pA4s=',
                    clientPublicKey: 'oP8q7r6s5t4u3v2w1x0yZ9A8B7C6D5E4F3G2H1I=',
                    serverPublicKey: 'sE8r7v6e5r4P3u2b1l0i9cK8e7y6V5a4l3u2e1==',
                    presharedKey: 'kL9m8N7b6V5c4X3z2A1s0D9f8G7h6J5k4L3m2N1=',
                    authSecretToken: 'mt5_sec_9948a7fbc231908e41de7a',
                    encryptionCipher: 'ChaCha20-Poly1305 (256-bit AEAD)',
                    mtu: 1420,
                    killSwitchEnabled: true,
                    targetBroker: 'IC Markets / Pepperstone (Raw ECN)',
                    vpsDatacenter: 'Equinix LD4 (London, UK)',
                  };
                  triggerTextDownload(generateMQL5WebRequestEA(vpn), 'Quantum_VPN_Bridge_EA.mq5', 'text/plain');
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download VPN Bridge EA (.MQ5)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. STEP-BY-STEP DESKTOP SETUP WALKTHROUGH */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span>Quick 3-Step Desktop Installation</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-slate-200 text-sm">Download & Unzip</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-8">
              Click <strong>"Download Desktop Suite (.ZIP)"</strong> and extract the archive to your desired location (e.g. <code className="text-emerald-400 font-mono">C:\QuantumMT5</code>).
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-slate-200 text-sm">Create Shortcut</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-8">
              Right-click <code className="text-cyan-400 font-mono">Setup-Desktop-Shortcut.ps1</code> and select <strong>"Run with PowerShell"</strong> to pin the app icon to your Desktop.
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-slate-200 text-sm">Launch & Trade</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-8">
              Double-click the new Desktop icon to launch the full AI Market Watcher and trade Gold / Oil with automated break-even protection!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

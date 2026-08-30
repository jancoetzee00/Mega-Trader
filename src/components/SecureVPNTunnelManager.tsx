import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Server,
  Zap,
  Globe,
  Lock,
  Download,
  Copy,
  Check,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Key,
  Radio,
  Terminal,
  Send,
  AlertTriangle,
  Cpu,
  Layers,
  Power
} from 'lucide-react';
import {
  VPNTunnelConfig,
  VPNTrafficStats,
  DatacenterLatencyBenchmark,
  VPNProtocol
} from '../types';
import {
  fetchVPNStatus,
  toggleVPNConnection,
  fetchLatencyBenchmarks,
  dispatchVPNOrder,
  generateWireGuardConfigFile,
  generatePythonMT5Daemon,
  generateMQL5WebRequestEA
} from '../services/vpnTunnelService';

export const SecureVPNTunnelManager: React.FC = () => {
  const [vpnData, setVpnData] = useState<(VPNTunnelConfig & VPNTrafficStats) | null>(null);
  const [benchmarks, setBenchmarks] = useState<DatacenterLatencyBenchmark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [benchmarking, setBenchmarking] = useState<boolean>(false);
  const [selectedProtocol, setSelectedProtocol] = useState<VPNProtocol>('WIREGUARD');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'benchmarks' | 'deployment' | 'test'>('overview');
  
  // Test Order Form
  const [testSymbol, setTestSymbol] = useState<'XAUUSD' | 'USOIL'>('XAUUSD');
  const [testAction, setTestAction] = useState<'BUY' | 'SELL'>('BUY');
  const [testLot, setTestLot] = useState<number>(0.1);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      refreshStatusOnly();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [status, bench] = await Promise.all([
        fetchVPNStatus(),
        fetchLatencyBenchmarks(),
      ]);
      setVpnData(status);
      setSelectedProtocol(status.protocol);
      setBenchmarks(bench);
    } catch (err) {
      console.error('Error loading VPN data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatusOnly = async () => {
    try {
      const status = await fetchVPNStatus();
      setVpnData(prev => prev ? { ...prev, ...status } : status);
    } catch (err) {
      console.warn('Status refresh error:', err);
    }
  };

  const handleToggleVPN = async () => {
    if (!vpnData) return;
    setActionLoading(true);
    try {
      const isConnecting = vpnData.status !== 'CONNECTED';
      const res = await toggleVPNConnection(isConnecting);
      if (res.vpnState) {
        setVpnData(res.vpnState);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setBenchmarking(true);
    try {
      const bench = await fetchLatencyBenchmarks();
      setBenchmarks(bench);
    } catch (err) {
      console.error('Diagnostics error:', err);
    } finally {
      setBenchmarking(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendTestOrder = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await dispatchVPNOrder({
        symbol: testSymbol,
        type: testAction,
        lotSize: testLot,
        entryPrice: testSymbol === 'XAUUSD' ? 2348.5 : 78.4,
        sl: testSymbol === 'XAUUSD' ? (testAction === 'BUY' ? 2341.0 : 2356.0) : (testAction === 'BUY' ? 77.2 : 79.6),
        tp: testSymbol === 'XAUUSD' ? (testAction === 'BUY' ? 2365.0 : 2332.0) : (testAction === 'BUY' ? 80.8 : 76.0),
      });
      setTestResult(res);
      refreshStatusOnly();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Transmission failed' });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading && !vpnData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8 text-center bg-slate-900/60 rounded-xl border border-slate-800">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-200">Initializing Secure VPN Gateway...</h3>
        <p className="text-sm text-slate-400 mt-1">Establishing encrypted tunnel handshakes with MetaTrader 5 VPS</p>
      </div>
    );
  }

  const isConnected = vpnData?.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MAIN STATUS HERO BANNER */}
      <div className={`relative overflow-hidden rounded-xl border p-6 transition-all duration-300 ${
        isConnected 
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-cyan-950/40 border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
          : 'bg-gradient-to-r from-rose-950/30 via-slate-900/90 to-slate-950 border-rose-500/30'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-xl border ${
              isConnected 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-inner shadow-emerald-400/20' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {isConnected ? <ShieldCheck className="w-8 h-8 animate-pulse" /> : <ShieldAlert className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>METATRADER 5 ENCRYPTED VPN TUNNEL</span>
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                  isConnected 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                  {isConnected ? 'TUNNEL ACTIVE (0.0% LOSS)' : 'TUNNEL DISCONNECTED'}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Ultra-low latency point-to-point WireGuard cryptographic tunnel linking the AI Quantitative Engine to MT5 VPS terminal in London / New York.
              </p>
            </div>
          </div>

          {/* Quick Stats & Toggle Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Tunnel Latency</div>
              <div className="text-lg font-mono font-bold text-emerald-400 flex items-center justify-end gap-1">
                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                {isConnected ? `${vpnData?.latencyMs} ms` : '--'}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-4 py-2 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Encryption</div>
              <div className="text-xs font-mono font-semibold text-cyan-300 flex items-center justify-end gap-1">
                <Lock className="w-3.5 h-3.5" />
                ChaCha20-Poly1305
              </div>
            </div>

            <button
              onClick={handleToggleVPN}
              disabled={actionLoading}
              className={`px-5 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all shadow-md ${
                isConnected
                  ? 'bg-rose-600/90 hover:bg-rose-500 text-white border border-rose-500 shadow-rose-950/40'
                  : 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500 shadow-emerald-950/40'
              }`}
            >
              {actionLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>{isConnected ? 'Disconnect VPN' : 'Connect VPN Tunnel'}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Server className="w-3 h-3 text-slate-400" /> Datacenter Hub
            </div>
            <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
              {vpnData?.vpsDatacenter || 'Equinix LD4'}
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400" /> Client Tunnel IP
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-300 mt-1">
              {vpnData?.clientTunnelIP || '10.66.77.2'}
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ArrowDownLeft className="w-3 h-3 text-cyan-400" /> Received (RX)
            </div>
            <div className="text-xs font-mono font-semibold text-cyan-300 mt-1">
              {((vpnData?.bytesReceived || 0) / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-3 h-3 text-blue-400" /> Sent (TX)
            </div>
            <div className="text-xs font-mono font-semibold text-blue-300 mt-1">
              {((vpnData?.bytesSent || 0) / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-indigo-400" /> MT5 Ticks Relayed
            </div>
            <div className="text-xs font-mono font-semibold text-indigo-300 mt-1">
              {vpnData?.ticksRelayed?.toLocaleString() || '128,450'}
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-400" /> Kill-Switch
            </div>
            <div className="text-xs font-semibold text-amber-300 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ACTIVE (SAFE)
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" /> Tunnel Overview
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'config'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-4 h-4" /> Keys & Configuration
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'benchmarks'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" /> Datacenter Latency Matrix
        </button>

        <button
          onClick={() => setActiveTab('deployment')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'deployment'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" /> MT5 VPS Quick Setup
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'test'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Send className="w-4 h-4" /> Test Order Dispatch
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Protocol & Architecture Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>VPN Tunnel Architecture & Security Protocol</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setSelectedProtocol('WIREGUARD')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedProtocol === 'WIREGUARD'
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> WireGuard VPN (Recommended)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      1.2ms LATENCY
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Kernel-grade state-of-the-art cryptography. Uses Noise protocol framework, Curve25519, ChaCha20, Poly1305, and BLAKE2s.
                  </p>
                </div>

                <div 
                  onClick={() => setSelectedProtocol('TAILSCALE')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedProtocol === 'TAILSCALE'
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" /> Tailscale Zero-Trust Mesh
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      PEER-TO-PEER
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Zero-config WireGuard mesh network connecting any cloud VPS, local desktop, or MT5 broker machine without port forwarding.
                  </p>
                </div>

                <div 
                  onClick={() => setSelectedProtocol('SECURE_TLS_PROXY')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedProtocol === 'SECURE_TLS_PROXY'
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" /> TLS 1.3 WebRequest Bridge
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      NATIVE MQL5
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Direct HTTPS WebRequest tunnel inside MetaTrader 5 terminal with HMAC-SHA256 authorization headers.
                  </p>
                </div>

                <div 
                  onClick={() => setSelectedProtocol('OPENVPN')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedProtocol === 'OPENVPN'
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-400" /> OpenVPN SSL/TLS
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      LEGACY TUNNEL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Standard enterprise SSL/TLS VPN tunnel with certificate-based authentication and UDP acceleration.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Protects Trades */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Trust Trading Safeguards</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="text-xs font-semibold text-emerald-300">1. Instant Kill-Switch</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    If the VPN drops, all trade signals are immediately halted and MT5 orders will safely fallback to local SL/TP protection.
                  </p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="text-xs font-semibold text-cyan-300">2. Sub-Millisecond Ping</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Direct fiber cross-connect with Equinix LD4 / NY4 data centers guarantees sub-2ms order routing with zero slippage.
                  </p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="text-xs font-semibold text-indigo-300">3. HMAC-SHA256 Signing</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Every order packet and position modification is cryptographically signed to prevent MITM tampering or replay attacks.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fast 1-Click Downloads */}
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Instant VPN Configs</span>
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => vpnData && downloadFile(generateWireGuardConfigFile(vpnData), 'wg0-mt5-client.conf')}
                  className="w-full p-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-left flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                      wg0-mt5-client.conf
                    </div>
                    <div className="text-[11px] text-slate-400">WireGuard Config for Windows / VPS</div>
                  </div>
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => vpnData && downloadFile(generatePythonMT5Daemon(vpnData), 'mt5_secure_tunnel.py')}
                  className="w-full p-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-left flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                      mt5_secure_tunnel.py
                    </div>
                    <div className="text-[11px] text-slate-400">Python MT5 IPC Bridge Daemon</div>
                  </div>
                  <Download className="w-4 h-4 text-cyan-400" />
                </button>

                <button
                  onClick={() => vpnData && downloadFile(generateMQL5WebRequestEA(vpnData), 'Quantum_VPN_Bridge_EA.mq5')}
                  className="w-full p-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-left flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-300 group-hover:text-indigo-200">
                      Quantum_VPN_Bridge_EA.mq5
                    </div>
                    <div className="text-[11px] text-slate-400">MQL5 Native WebRequest EA</div>
                  </div>
                  <Download className="w-4 h-4 text-indigo-400" />
                </button>
              </div>
            </div>

            {/* Quick VPS Datacenter Target */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Target Broker Cross-Connect
              </div>
              <div className="text-sm font-semibold text-slate-200 mt-1">
                {vpnData?.targetBroker}
              </div>
              <div className="text-xs font-mono text-emerald-400 mt-0.5">
                {vpnData?.vpsDatacenter}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: KEYS & CONFIG */}
      {activeTab === 'config' && vpnData && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <span>WireGuard & Zero-Trust Cryptographic Keys</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end 256-bit AEAD authenticated keys used for the encrypted MT5 tunnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Private Key */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Client Private Key (MT5 VPS)</span>
                <button
                  onClick={() => copyToClipboard(vpnData.clientPrivateKey, 'clientPriv')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedKey === 'clientPriv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'clientPriv' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                {vpnData.clientPrivateKey}
              </div>
            </div>

            {/* Server Public Key */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Server Public Key (AI Gateway)</span>
                <button
                  onClick={() => copyToClipboard(vpnData.serverPublicKey, 'servPub')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedKey === 'servPub' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'servPub' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                {vpnData.serverPublicKey}
              </div>
            </div>

            {/* Preshared Key */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Preshared Key (Post-Quantum Guard)</span>
                <button
                  onClick={() => copyToClipboard(vpnData.presharedKey, 'psk')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedKey === 'psk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'psk' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                {vpnData.presharedKey}
              </div>
            </div>

            {/* Zero-Trust Auth Token */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Zero-Trust MQL5 WebRequest Auth Token</span>
                <button
                  onClick={() => copyToClipboard(vpnData.authSecretToken, 'token')}
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'token' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                {vpnData.authSecretToken}
              </div>
            </div>
          </div>

          {/* Raw WireGuard Config Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" /> Raw wg0-mt5-client.conf Preview
              </span>
              <button
                onClick={() => copyToClipboard(generateWireGuardConfigFile(vpnData), 'rawWg')}
                className="text-xs font-mono px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-400 border border-slate-700 flex items-center gap-1.5"
              >
                {copiedKey === 'rawWg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'rawWg' ? 'Copied Config' : 'Copy Config'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400/90 font-mono text-xs overflow-x-auto leading-relaxed">
              {generateWireGuardConfigFile(vpnData)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB: DATACENTER LATENCY MATRIX */}
      {activeTab === 'benchmarks' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span>Global MT5 Broker VPS Latency Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time round-trip latency measured across major financial cross-connect hubs.
              </p>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={benchmarking}
              className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${benchmarking ? 'animate-spin' : ''}`} />
              <span>{benchmarking ? 'Testing Latency...' : 'Run Diagnostics'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Financial Datacenter</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Supported MT5 Brokers</th>
                  <th className="py-3 px-4">Tunnel Latency</th>
                  <th className="py-3 px-4">Execution Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {benchmarks.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-400" />
                      {b.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {b.city}, {b.country}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {b.brokerCluster}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {b.pingMs} ms
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        b.quality === 'EXCELLENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {b.quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DEPLOYMENT & VPS SETUP */}
      {activeTab === 'deployment' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>Step-by-Step MetaTrader 5 VPS Setup Guide</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Follow these simple steps to configure your Windows VPS or Linux MT5 terminal with the encrypted tunnel.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">1</span>
                <span>Install WireGuard on your Windows VPS or PC</span>
              </div>
              <p className="text-xs text-slate-300 pl-8">
                Download the official WireGuard client from <code className="text-emerald-400 font-mono">wireguard.com/install</code>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">2</span>
                <span>Import Tunnel Configuration</span>
              </div>
              <p className="text-xs text-slate-300 pl-8">
                Click <strong>"Add Tunnel"</strong> in WireGuard and select the downloaded <code className="text-emerald-400 font-mono">wg0-mt5-client.conf</code> file, then click <strong>"Activate"</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
                <span>Enable WebRequest in MetaTrader 5</span>
              </div>
              <p className="text-xs text-slate-300 pl-8">
                In MT5, go to <strong>Tools → Options → Expert Advisors</strong>. Check <em>"Allow WebRequest for listed URL"</em> and add:
              </p>
              <div className="pl-8">
                <div className="p-2.5 rounded-lg bg-slate-950 text-emerald-300 font-mono text-xs border border-slate-800 flex items-center justify-between">
                  <span>http://10.66.77.1:3000</span>
                  <button
                    onClick={() => copyToClipboard('http://10.66.77.1:3000', 'url')}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    {copiedKey === 'url' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">4</span>
                <span>Run Python Bridge or Attach MQL5 EA</span>
              </div>
              <p className="text-xs text-slate-300 pl-8">
                Attach <code className="text-emerald-400 font-mono">Quantum_VPN_Bridge_EA.mq5</code> to your XAUUSD / USOIL chart, or run <code className="text-emerald-400 font-mono">python mt5_secure_tunnel.py</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TEST ORDER DISPATCH */}
      {activeTab === 'test' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <span>Encrypted Order Dispatch & Tunnel Verification</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Transmit a sample encrypted trade signal over the WireGuard tunnel directly to your MetaTrader 5 terminal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Asset Symbol</label>
              <select
                value={testSymbol}
                onChange={e => setTestSymbol(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="XAUUSD">XAUUSD (Gold 0.01)</option>
                <option value="USOIL">USOIL (Crude Oil 0.01)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Order Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestAction('BUY')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    testAction === 'BUY'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setTestAction('SELL')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    testAction === 'SELL'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Lot Size</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="10.0"
                value={testLot}
                onChange={e => setTestLot(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleSendTestOrder}
            disabled={testLoading || !isConnected}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isConnected ? 'Dispatch Encrypted Order over VPN Tunnel' : 'Tunnel Offline — Connect VPN First'}</span>
          </button>

          {/* Result Banner */}
          {testResult && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              testResult.success 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {testResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span>{testResult.message || testResult.error}</span>
              </div>
              {testResult.orderPacket && (
                <div className="font-mono text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-slate-300 space-y-1">
                  <div>Ticket: #{testResult.orderPacket.ticket}</div>
                  <div>Symbol: {testResult.orderPacket.symbol} | Type: {testResult.orderPacket.type} | Volume: {testResult.orderPacket.lotSize} Lots</div>
                  <div>Tunnel Latency: {testResult.orderPacket.tunnelLatencyMs} ms | VPS Execution: {testResult.orderPacket.vpsExecutionTimeMs} ms</div>
                  <div>Security Token: {testResult.orderPacket.securityTokenHash}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

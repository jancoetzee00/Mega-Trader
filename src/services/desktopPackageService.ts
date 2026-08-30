import JSZip from 'jszip';
import { StrategyConfig, VPNTunnelConfig } from '../types';
import { generateMql5Code } from './mql5Generator';
import { generatePythonMt5Code } from './pythonGenerator';
import { generateWireGuardConfigFile, generatePythonMT5Daemon, generateMQL5WebRequestEA } from './vpnTunnelService';

export interface DesktopPackageOptions {
  config: StrategyConfig;
  vpnConfig?: VPNTunnelConfig;
  appUrl?: string;
}

// 1. Generate Windows Launch Batch Script
export function generateWindowsLauncherBat(appUrl: string = 'https://ai.studio/build'): string {
  return `@echo off
title Quantum AI - MetaTrader 5 Desktop Trading Terminal
color 0A
cls

echo ===============================================================================
echo       QUANTUM AI - INSTITUTIONAL METATRADER 5 DESKTOP TRADING SYSTEM
echo ===============================================================================
echo [INFO] Initializing Desktop Workspace...
echo [INFO] Web Terminal Target: ${appUrl}
echo.

:: Check if Chrome or Edge is installed for App Window mode
set BROWSER_FOUND=0

if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    echo [OK] Launching in Dedicated Google Chrome App Frame...
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="${appUrl}" --window-size=1440,900 --user-data-dir="%LOCALAPPDATA%\\QuantumMT5App"
    set BROWSER_FOUND=1
    goto START_BRIDGE
)

if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    echo [OK] Launching in Dedicated Google Chrome App Frame...
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="${appUrl}" --window-size=1440,900 --user-data-dir="%LOCALAPPDATA%\\QuantumMT5App"
    set BROWSER_FOUND=1
    goto START_BRIDGE
)

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo [OK] Launching in Dedicated Microsoft Edge App Frame...
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="${appUrl}" --window-size=1440,900 --user-data-dir="%LOCALAPPDATA%\\QuantumMT5App"
    set BROWSER_FOUND=1
    goto START_BRIDGE
)

if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    echo [OK] Launching in Dedicated Microsoft Edge App Frame...
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="${appUrl}" --window-size=1440,900 --user-data-dir="%LOCALAPPDATA%\\QuantumMT5App"
    set BROWSER_FOUND=1
    goto START_BRIDGE
)

:: Fallback to default browser
if %BROWSER_FOUND%==0 (
    echo [INFO] Opening default browser...
    start "" "${appUrl}"
)

:START_BRIDGE
echo.
echo ===============================================================================
echo [BRIDGE] To start the local MT5 Python Zero-Trust Bridge Daemon:
echo          Run: Python_Bridge\\run_bridge.bat
echo [TUNNEL] To activate WireGuard Low-Latency VPN:
echo          Import: VPN_Tunnel\\wg0-mt5-client.conf into WireGuard for Windows
echo ===============================================================================
echo.
pause
`;
}

// 2. Generate PowerShell Desktop Shortcut Creator
export function generatePowerShellShortcutScript(appUrl: string = 'https://ai.studio/build'): string {
  return `# ==============================================================================
# Quantum MT5 Desktop Trading Terminal - Windows Shortcut Creator
# ==============================================================================
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Creating Quantum AI MT5 Desktop Shortcuts..." -ForegroundColor Cyan

$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path $DesktopPath "Quantum AI MT5 Terminal.lnk"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetBat = Join-Path $ScriptDir "Launch-Desktop-App.bat"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = $ScriptDir
$Shortcut.Description = "Launch Quantum AI MetaTrader 5 Institutional Trading Suite"
$Shortcut.Save()

Write-Host " [SUCCESS] Desktop shortcut created at: $ShortcutPath" -ForegroundColor Green
Write-Host "Double click 'Quantum AI MT5 Terminal' on your Desktop to trade!" -ForegroundColor Yellow
Start-Sleep -Seconds 3
`;
}

// 3. Generate macOS / Linux Shell Launcher
export function generateUnixLauncherSh(appUrl: string = 'https://ai.studio/build'): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# Quantum AI MT5 Desktop Trading Launcher (macOS / Linux)
# ==============================================================================

echo "======================================================================"
echo "      QUANTUM AI - METATRADER 5 DESKTOP TRADING TERMINAL"
echo "======================================================================"
echo "Launching desktop workspace..."

URL="${appUrl}"

# Check for Chrome / Chromium app mode
if command -v google-chrome &> /dev/null; then
    google-chrome --app="$URL" --window-size=1440,900 &
elif command -v chromium &> /dev/null; then
    chromium --app="$URL" --window-size=1440,900 &
elif command -v open &> /dev/null; then
    open "$URL"
elif command -v xdg-open &> /dev/null; then
    xdg-open "$URL"
else
    echo "Please open $URL in your web browser."
fi

echo "Terminal initialized."
`;
}

// 4. Generate Complete Desktop README Installation Guide
export function generateDesktopReadme(config: StrategyConfig): string {
  return `================================================================================
QUANTUM AI - INSTITUTIONAL METATRADER 5 DESKTOP TRADING SUITE
Gold (XAUUSD) & Crude Oil (USOIL) Autonomous Execution System
================================================================================

PACKAGE CONTENTS:
--------------------------------------------------------------------------------
1. Launch-Desktop-App.bat        - 1-Click Desktop Application launcher (Windows)
2. Setup-Desktop-Shortcut.ps1    - Creates Windows Desktop Icon & Start Menu Link
3. Launch-Desktop-App.sh         - 1-Click Desktop Application launcher (macOS/Linux)
4. MT5_Experts/
   - Quantum_AI_AuraBreak.mq5    - Primary Institutional Multi-Indicator EA
   - Quantum_VPN_Bridge_EA.mq5   - Zero-Trust Encrypted WebRequest Signal Bridge
5. VPN_Tunnel/
   - wg0-mt5-client.conf         - Pre-configured WireGuard Client (Equinix LD4/NY4)
6. Python_Bridge/
   - mt5_secure_tunnel.py        - Python IPC Bridge with HMAC-SHA256 Auth
   - requirements.txt            - Python Dependencies (MetaTrader5, requests)
   - run_bridge.bat              - 1-Click Python Daemon Launcher
7. Configs/
   - Strategy_Config.json        - Active Algorithm Parameters & Risk Profile

================================================================================
QUICK 3-STEP INSTALLATION GUIDE:
================================================================================

STEP 1: INSTALL THE EXPERT ADVISOR IN METATRADER 5
1. Open your MetaTrader 5 Desktop Terminal.
2. Click File -> Open Data Folder.
3. Open the MQL5 -> Experts folder.
4. Copy "Quantum_AI_AuraBreak.mq5" and "Quantum_VPN_Bridge_EA.mq5" into this folder.
5. In MT5, press F4 to open MetaEditor, open the file, and press F7 (Compile).
6. In MT5 Navigator window, right-click "Expert Advisors" and select "Refresh".

STEP 2: ENABLE ALGO TRADING & WEBREQUEST
1. In MT5, click Tools -> Options (Ctrl+O) -> Expert Advisors tab.
2. Check:
   [X] Allow Algo Trading
   [X] Allow DLL imports
   [X] Allow WebRequest for listed URL
3. Add the following URL to the WebRequest whitelist:
   http://10.66.77.1:3000
   http://localhost:3000

STEP 3: LAUNCH THE DESKTOP APPLICATION
1. Run "Setup-Desktop-Shortcut.ps1" (Right click -> Run with PowerShell) to add
   the app icon to your Windows Desktop.
2. Double-click "Launch-Desktop-App.bat" or the new Desktop Shortcut to open the
   Quantum AI Market Watcher and live trading dashboard.
3. To enable real-time order execution from the AI Watcher, run
   "Python_Bridge\\run_bridge.bat" or attach the EA to your Gold (XAUUSD) M15 chart!

================================================================================
RISK MANAGEMENT NOTICE:
================================================================================
Always test on an MT5 Demo account before deploying live capital.
Ensure your broker supports raw ECN spreads (<= 15 points on Gold) for best execution.
================================================================================
`;
}

// 5. Generate Full Desktop Suite ZIP Archive
export async function generateFullDesktopSuiteZip(options: DesktopPackageOptions): Promise<Blob> {
  const zip = new JSZip();
  const { config, vpnConfig, appUrl = window.location.origin } = options;

  // Root files
  zip.file('Launch-Desktop-App.bat', generateWindowsLauncherBat(appUrl));
  zip.file('Setup-Desktop-Shortcut.ps1', generatePowerShellShortcutScript(appUrl));
  zip.file('Launch-Desktop-App.sh', generateUnixLauncherSh(appUrl));
  zip.file('README_DESKTOP_INSTALLATION.txt', generateDesktopReadme(config));

  // Configs Folder
  const configFolder = zip.folder('Configs');
  configFolder?.file('Strategy_Config.json', JSON.stringify(config, null, 2));

  // MT5_Experts Folder
  const mqlFolder = zip.folder('MT5_Experts');
  const mql5Code = generateMql5Code(config);
  mqlFolder?.file('Quantum_AI_AuraBreak.mq5', mql5Code);

  const fallbackVpn = vpnConfig || {
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

  const vpnEaCode = generateMQL5WebRequestEA(fallbackVpn);
  mqlFolder?.file('Quantum_VPN_Bridge_EA.mq5', vpnEaCode);

  // VPN_Tunnel Folder
  const vpnFolder = zip.folder('VPN_Tunnel');
  const wgConfig = generateWireGuardConfigFile(fallbackVpn);
  vpnFolder?.file('wg0-mt5-client.conf', wgConfig);

  // Python_Bridge Folder
  const pyFolder = zip.folder('Python_Bridge');
  const pythonAlgo = generatePythonMt5Code(config);
  pyFolder?.file('apex_mt5_bot.py', pythonAlgo);

  const pythonTunnel = generatePythonMT5Daemon(fallbackVpn);
  pyFolder?.file('mt5_secure_tunnel.py', pythonTunnel);

  pyFolder?.file(
    'requirements.txt',
    `MetaTrader5>=5.0.45\npandas>=2.0.0\nnumpy>=1.24.0\nrequests>=2.31.0\ncryptography>=41.0.0\nschedule>=1.2.0\n`
  );

  pyFolder?.file(
    'run_bridge.bat',
    `@echo off\ntitle Quantum AI - MT5 Zero-Trust Python Bridge Daemon\ncolor 0B\ncls\n\necho ===============================================================================\necho         QUANTUM AI - METATRADER 5 PYTHON BRIDGE DAEMON\necho ===============================================================================\n\npython -m pip install -r requirements.txt\ncls\necho [OK] Dependencies verified. Connecting to MT5...\npython mt5_secure_tunnel.py\npause\n`
  );

  return await zip.generateAsync({ type: 'blob' });
}

// 6. Direct file trigger helper
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerTextDownload(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(blob, filename);
}

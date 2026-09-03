import Constants from 'expo-constants';
import { Platform } from 'react-native';

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function sanitizeUrlPiece(raw) {
  return String(raw || '')
    .trim()
    .replace(/^`+|`+$/g, '')
    .replace(/^'+|'+$/g, '')
    .replace(/^"+|"+$/g, '')
    .trim();
}

function normalizeHost(raw) {
  const h = sanitizeUrlPiece(raw).toLowerCase();
  if (!h || h === 'localhost') return null;
  if (!IPV4.test(h) && !h.includes('.')) return null;
  return h;
}

function parseMetroHostFromString(value) {
  if (!value || typeof value !== 'string') return null;
  let text = sanitizeUrlPiece(value);
  try {
    text = decodeURIComponent(text);
  } catch {
    /* keep raw */
  }
  const httpMatch = text.match(/https?:\/\/([^/:]+)/i);
  const fromHttp = normalizeHost(httpMatch?.[1]);
  if (fromHttp) return fromHttp;
  return null;
}

function readMetroHostFromExpoConstants() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoGoConfig?.hostUri,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
    Constants.manifest?.hostUri,
    Constants.linkingUri,
    Constants.experienceUrl,
  ];

  for (const uri of candidates) {
    if (!uri) continue;
    const host = parseMetroHostFromString(uri);
    if (host && host !== '127.0.0.1' && host !== 'localhost' && host !== '10.0.2.2') {
      return host;
    }
  }
  return null;
}

/**
 * Heuristic detection for Android emulator. Expo Constants flags are unreliable
 * across versions, so combine multiple signals. On Android emulator the system
 * model often includes the Emulator/sdk_gphone strings and the host name of the
 * metro bundler would resolve to 127.0.0.1 or localhost if we're on the same
 * machine (implying we are in a simulator/emulator).
 */
function detectAndroidEmulator() {
  if (Platform.OS !== 'android') return false;
  const a = Constants.platform?.android;
  const d = Constants.device;
  const directFlag =
    (a?.isRunningInEmulator === true) ||
    (d?.android?.isRunningInEmulator === true);
  if (directFlag) return true;

  const model = String(
    d?.modelName ?? d?.model ?? a?.model ?? ''
  ).toLowerCase();
  const systemName = String(d?.systemName ?? '').toLowerCase();
  if (
    model.includes('sdk_gphone') ||
    model.includes('emulator') ||
    model.includes('google_sdk') ||
    systemName.includes('emulator')
  ) {
    return true;
  }

  // Fallback: if we're on Android and Metro bundler host resolves to 127.0.0.1 or localhost,
  // we're almost certainly on an emulator where our Metro host is the same machine.
  const metro = readMetroHostFromExpoConstants();
  if (!metro) return true;

  return false;
}

function detectIOSSimulator() {
  if (Platform.OS !== 'ios') return false;
  const directFlag =
    (Constants.platform?.ios?.isRunningInSimulator === true) ||
    (Constants.device?.ios?.isRunningInSimulator === true);
  if (directFlag) return true;
  const model = String(Constants.device?.modelName ?? Constants.device?.model ?? '').toLowerCase();
  if (model.startsWith('simulator') || model.includes('simulator')) return true;
  return false;
}

function resolveDevMachineHostPort() {
  const port = Number(process.env.EXPO_PUBLIC_API_PORT) || 5001;

  // 1. Priority: Environment variable (highest priority)
  const envHost = normalizeHost(process.env.EXPO_PUBLIC_DEV_API_HOST);
  if (envHost) {
    return { host: envHost, port };
  }

  // 2. Detect simulator/emulator
  const isAndroidEmulator = detectAndroidEmulator();
  const isIOSSimulator = detectIOSSimulator();

  if (isAndroidEmulator) {
    return { host: '10.0.2.2', port };
  }

  if (isIOSSimulator) {
    return { host: '127.0.0.1', port };
  }

  // 3. Physical device: prefer Metro host from Expo constants
  const metroHost = readMetroHostFromExpoConstants();
  if (metroHost) {
    return { host: metroHost, port };
  }

  // 4. Fallback with warning
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      '[apiUrl] Set EXPO_PUBLIC_DEV_API_HOST in mobile/.env (your Mac IP, same Wi‑Fi as phone).\n' +
        'Example: EXPO_PUBLIC_DEV_API_HOST=192.168.1.77'
    );
  }

  return { host: '127.0.0.1', port };
}

export function getApiBaseUrl() {
  // 1. Environment variable has highest priority (supports ngrok URLs)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return sanitizeUrlPiece(envUrl).replace(/\/$/, '');
  }

  // 2. Use local dev API in development
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const { host, port } = resolveDevMachineHostPort();
    const safeHost = sanitizeUrlPiece(host);
    const url = `http://${safeHost}:${port}`;
    console.log('Using local dev API:', url);
    return url;
  }

  // 3. Production fallback
  return 'http://localhost:5001';
}

function getSubnetCommonIps(ipv4) {
  if (!ipv4 || !IPV4.test(ipv4)) return [];
  const parts = ipv4.split('.');
  if (parts.length !== 4) return [];
  const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const commonLastOctets = [
    parseInt(parts[3], 10),
    1, 2, 5, 10, 20, 50, 77, 100, 123, 150, 200, 222, 224, 250, 254,
  ];
  const seen = new Set();
  const result = [];
  for (const last of commonLastOctets) {
    if (last >= 1 && last <= 254 && !seen.has(last)) {
      seen.add(last);
      result.push(`${subnet}.${last}`);
    }
  }
  return result;
}

export function getApiBaseUrlCandidates() {
  const primary = getApiBaseUrl();
  const set = new Set([primary]);

  const port = Number(process.env.EXPO_PUBLIC_API_PORT) || 5001;

  const metro = readMetroHostFromExpoConstants();
  if (metro) set.add(`http://${metro}:${port}`);

  if (Platform.OS === 'android') {
    set.add(`http://10.0.2.2:${port}`);
    set.add(`http://127.0.0.1:${port}`);
  }

  if (Platform.OS === 'ios') {
    set.add(`http://127.0.0.1:${port}`);
  }

  set.add(`http://localhost:${port}`);

  const primaryHost = (() => {
    try {
      const m = primary.match(/^https?:\/\/([^/:]+)/i);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  })();

  const subnetHosts = new Set();
  if (primaryHost) {
    for (const ip of getSubnetCommonIps(primaryHost)) subnetHosts.add(ip);
  }
  if (metro) {
    for (const ip of getSubnetCommonIps(metro)) subnetHosts.add(ip);
  }
  for (const ip of subnetHosts) {
    set.add(`http://${ip}:${port}`);
  }

  return Array.from(set);
}

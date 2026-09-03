import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const API_PORT = Number(process.env.EXPO_PUBLIC_API_PORT) || 5001;

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
  if (!h) return null;
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') {
    return null;
  }
  if (IPV4.test(h)) return h;
  return null;
}

function parseHostFromAny(value) {
  if (!value || typeof value !== 'string') return null;
  let text = sanitizeUrlPiece(value);
  try {
    text = decodeURIComponent(text);
  } catch {
    /* keep raw */
  }

  const ipv4Match = text.match(/(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?/);
  const fromIpv4 = normalizeHost(ipv4Match?.[1]);
  if (fromIpv4) return fromIpv4;

  const schemeMatch = text.match(/(?:https?|exp|exps):\/\/([^/:]+)/i);
  return normalizeHost(schemeMatch?.[1]);
}

function readScriptURL() {
  try {
    return NativeModules.SourceCode?.scriptURL || null;
  } catch {
    return null;
  }
}

function readMetroHost() {
  const candidates = [
    readScriptURL(),
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
    const host = parseHostFromAny(uri);
    if (host) return host;
  }
  return null;
}

function resolveDevMachineHostPort() {
  const metroHost = readMetroHost();
  if (metroHost) {
    return { host: metroHost, port: API_PORT };
  }

  if (Platform.OS === 'android') {
    return { host: '10.0.2.2', port: API_PORT };
  }

  const envHost = normalizeHost(process.env.EXPO_PUBLIC_DEV_API_HOST);
  if (envHost) {
    console.log('Using forced dev API host:', envHost);
    return { host: envHost, port: API_PORT };
  }

  return { host: '127.0.0.1', port: API_PORT };
}

export function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return sanitizeUrlPiece(envUrl).replace(/\/$/, '');
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const { host, port } = resolveDevMachineHostPort();
    const url = `http://${sanitizeUrlPiece(host)}:${port}`;
    console.log('Using local dev API:', url);
    return url;
  }

  return 'http://localhost:5001';
}

export function getApiBaseUrlCandidates() {
  const primary = getApiBaseUrl();
  const set = new Set([primary]);

  // If we have a forced dev host, only use that single URL
  if (process.env.EXPO_PUBLIC_DEV_API_HOST) {
    console.log('Using forced dev host, skipping other candidates');
    return Array.from(set);
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return Array.from(set);
  }

  const metro = readMetroHost();
  if (metro) set.add(`http://${metro}:${API_PORT}`);

  if (Platform.OS === 'android') {
    set.add(`http://10.0.2.2:${API_PORT}`);
  }

  if (Platform.OS === 'ios') {
    set.add(`http://127.0.0.1:${API_PORT}`);
  }

  return Array.from(set);
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type AgentMnemonicEntry = {
  sageo_id?: string;
  wallet_address?: string;
};

type AgentMnemonicsFile = {
  agents?: AgentMnemonicEntry[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AGENT_MNEMONICS_PATH = path.resolve(__dirname, '../../scripts/agent_mnemonics.json');

let cachedMtimeMs: number | null = null;
let cachedById: Map<string, string> | null = null;

function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
}

function loadAgentWalletMap(): Map<string, string> | null {
  if (!fs.existsSync(AGENT_MNEMONICS_PATH)) {
    return null;
  }

  const stat = fs.statSync(AGENT_MNEMONICS_PATH);
  if (cachedById && cachedMtimeMs === stat.mtimeMs) {
    return cachedById;
  }

  const raw = fs.readFileSync(AGENT_MNEMONICS_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as AgentMnemonicsFile;
  const map = new Map<string, string>();

  for (const entry of parsed.agents ?? []) {
    const sageoId = entry.sageo_id?.trim();
    const walletAddress = entry.wallet_address?.trim();
    if (!sageoId || !walletAddress) {
      continue;
    }
    const normalized = normalizeIdentifier(walletAddress);
    if (normalized) {
      map.set(sageoId, normalized);
    }
  }

  cachedById = map;
  cachedMtimeMs = stat.mtimeMs;
  return map;
}

export function getAgentWalletAddress(sageoId: string): string | null {
  const map = loadAgentWalletMap();
  if (!map) {
    return null;
  }
  return map.get(sageoId) ?? null;
}

export function getFirstAgentWalletAddress(): string | null {
  const map = loadAgentWalletMap();
  if (!map) {
    return null;
  }
  const first = map.values().next();
  return first.done ? null : first.value;
}

export function normalizeAgentIdentifier(value: string): string {
  return normalizeIdentifier(value);
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { LogicDriver } from 'js-moi-sdk';
import { initializeMOI, INTERACTION_LOGIC_ID } from './moi-client.js';

type InteractionRecord = {
  interaction_id: string;
  caller_sageo_id: string;
  callee_sageo_id: string;
  request_hash: string;
  response_hash: string;
  intent: string;
  status_code: number;
  timestamp: number;
  a2a_context_id: string;
  a2a_task_id: string;
  a2a_message_id: string;
  end_user_id: string;
  end_user_session_id: string;
};

type InteractionStats = {
  total_requests_sent: number;
  total_requests_received: number;
  total_responses_sent: number;
  success_count: number;
  unique_counterparties: number;
  last_interaction_at: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_PATH = path.resolve(
  __dirname,
  '../../../contract/SageoInteractionLogic/sageointeractionlogic.yaml'
);

let cachedDriver: LogicDriver | null = null;
let cachedManifestMtimeMs: number | null = null;

function toNumber(value: unknown): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isStorageNotFound(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('logic storage tree not found');
}

async function getInteractionDriver(): Promise<LogicDriver> {
  if (!INTERACTION_LOGIC_ID) {
    throw new Error('INTERACTION_LOGIC_ID is not set in moi-client.ts');
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Interaction manifest not found at ${MANIFEST_PATH}`);
  }

  const stat = fs.statSync(MANIFEST_PATH);
  if (cachedDriver && cachedManifestMtimeMs === stat.mtimeMs) {
    return cachedDriver;
  }

  const manifestYaml = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const manifest = yaml.load(manifestYamlSafe) as any;

  const { wallet } = await initializeMOI();
  const driver = new LogicDriver(INTERACTION_LOGIC_ID, manifest, wallet);
  cachedDriver = driver;
  cachedManifestMtimeMs = stat.mtimeMs;

  return driver;
}

async function readActorValue<T>(
  address: string,
  build: (builder: any) => any
): Promise<T> {
  const driver = await getInteractionDriver();
  if (!driver.ephemeralState) {
    throw new Error('Interaction logic does not expose actor state');
  }

  return driver.ephemeralState.get(address, build) as Promise<T>;
}

async function readInteractionRecord(address: string, index: number): Promise<InteractionRecord> {
  const [
    interaction_id,
    caller_sageo_id,
    callee_sageo_id,
    request_hash,
    response_hash,
    intent,
    status_code,
    timestamp,
    a2a_context_id,
    a2a_task_id,
    a2a_message_id,
    end_user_id,
    end_user_session_id,
  ] = await Promise.all([
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('interaction_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('caller_sageo_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('callee_sageo_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('request_hash')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('response_hash')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('intent')),
    readActorValue<number>(address, (b) => b.entity('interactions').at(index).field('status_code')),
    readActorValue<number>(address, (b) => b.entity('interactions').at(index).field('timestamp')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('a2a_context_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('a2a_task_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('a2a_message_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('end_user_id')),
    readActorValue<string>(address, (b) => b.entity('interactions').at(index).field('end_user_session_id')),
  ]);

  return {
    interaction_id,
    caller_sageo_id,
    callee_sageo_id,
    request_hash,
    response_hash,
    intent,
    status_code: toNumber(status_code),
    timestamp: toNumber(timestamp),
    a2a_context_id,
    a2a_task_id,
    a2a_message_id,
    end_user_id,
    end_user_session_id,
  };
}

export async function getActorInteractions(
  address: string,
  limit: number,
  offset: number
): Promise<{ interactions: InteractionRecord[]; total: number }> {
  try {
    const totalValue = await readActorValue<number>(address, (b) => b.entity('interactions').length());
    const total = toNumber(totalValue);

    if (offset >= total) {
      return { interactions: [], total };
    }

    const count = Math.min(limit, total - offset);
    const records: InteractionRecord[] = [];

    for (let i = 0; i < count; i += 1) {
      const idx = total - offset - 1 - i;
      records.push(await readInteractionRecord(address, idx));
    }

    return { interactions: records, total };
  } catch (error) {
    if (isStorageNotFound(error)) {
      return { interactions: [], total: 0 };
    }
    throw error;
  }
}

export async function getActorInteractionById(
  address: string,
  interactionId: string
): Promise<InteractionRecord | null> {
  try {
    const totalValue = await readActorValue<number>(address, (b) => b.entity('interactions').length());
    const total = toNumber(totalValue);

    for (let idx = 0; idx < total; idx += 1) {
      const currentId = await readActorValue<string>(
        address,
        (b) => b.entity('interactions').at(idx).field('interaction_id')
      );
      if (currentId === interactionId) {
        return readInteractionRecord(address, idx);
      }
    }

    return null;
  } catch (error) {
    if (isStorageNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function getActorStats(address: string): Promise<InteractionStats | null> {
  try {
    const agentId = await readActorValue<string>(address, (b) => b.entity('agent_id'));
    if (!agentId) {
      return null;
    }

    const [
      totalRequestsSent,
      totalRequestsReceived,
      totalResponsesSent,
      successCount,
      uniqueCounterparties,
      lastInteractionAt,
    ] = await Promise.all([
      readActorValue<number>(address, (b) => b.entity('stats_total_requests_sent')),
      readActorValue<number>(address, (b) => b.entity('stats_total_requests_received')),
      readActorValue<number>(address, (b) => b.entity('stats_total_responses_sent')),
      readActorValue<number>(address, (b) => b.entity('stats_success_count')),
      readActorValue<number>(address, (b) => b.entity('stats_unique_counterparties')),
      readActorValue<number>(address, (b) => b.entity('stats_last_interaction_at')),
    ]);

    return {
      total_requests_sent: toNumber(totalRequestsSent),
      total_requests_received: toNumber(totalRequestsReceived),
      total_responses_sent: toNumber(totalResponsesSent),
      success_count: toNumber(successCount),
      unique_counterparties: toNumber(uniqueCounterparties),
      last_interaction_at: toNumber(lastInteractionAt),
    };
  } catch (error) {
    if (isStorageNotFound(error)) {
      return null;
    }
    throw error;
  }
}

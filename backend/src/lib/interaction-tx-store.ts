import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export interface InteractionTxEventInput {
  interaction_id: string;
  tx_hash: string;
  event_type: 'request' | 'response';
  is_sender?: boolean;
  actor_sageo_id: string;
  counterparty_sageo_id: string;
  a2a_context_id?: string;
  a2a_task_id?: string;
  a2a_message_id?: string;
  end_user_id?: string;
  end_user_session_id?: string;
  status_code?: number;
  timestamp?: number;
}

export interface InteractionTxEventRecord extends InteractionTxEventInput {
  id: number;
  created_at: number;
  explorer_url: string | null;
}

let db: DatabaseSync | null = null;

function resolveDbPath(): string {
  const configuredPath = process.env.INTERACTION_TX_DB_PATH?.trim();
  if (configuredPath) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);
  }
  return path.resolve(process.cwd(), 'data', 'interaction_tx.db');
}

function explorerUrlForTxHash(txHash: string): string | null {
  if (!txHash) {
    return null;
  }

  const template = process.env.MOI_EXPLORER_TX_URL_TEMPLATE?.trim();
  if (template) {
    if (template.includes('{txHash}')) {
      return template.replaceAll('{txHash}', txHash);
    }
    return `${template}${txHash}`;
  }

  const baseUrl = process.env.MOI_EXPLORER_TX_BASE_URL?.trim();
  if (baseUrl) {
    return `${baseUrl}${txHash}`;
  }

  return `https://voyage.moi.technology/interaction/?${encodeURIComponent(txHash)}`;
}

function hasColumn(database: DatabaseSync, tableName: string, columnName: string): boolean {
  const stmt = database.prepare(`PRAGMA table_info(${tableName})`);
  const rows = stmt.all() as Array<Record<string, unknown>>;
  return rows.some((row) => String(row.name || '').toLowerCase() === columnName.toLowerCase());
}

function getDb(): DatabaseSync {
  if (db) {
    return db;
  }

  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS interaction_tx_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interaction_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      is_sender INTEGER,
      actor_sageo_id TEXT NOT NULL,
      counterparty_sageo_id TEXT NOT NULL,
      a2a_context_id TEXT,
      a2a_task_id TEXT,
      a2a_message_id TEXT,
      end_user_id TEXT,
      end_user_session_id TEXT,
      status_code INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_interaction_tx_events_interaction_id
    ON interaction_tx_events (interaction_id, id)
  `);
  if (!hasColumn(db, 'interaction_tx_events', 'is_sender')) {
    db.exec(`ALTER TABLE interaction_tx_events ADD COLUMN is_sender INTEGER`);
  }

  return db;
}

export function storeInteractionTxEvent(input: InteractionTxEventInput): void {
  const interactionId = input.interaction_id?.trim();
  const txHash = input.tx_hash?.trim();
  const actorSageoId = input.actor_sageo_id?.trim();
  const counterpartySageoId = input.counterparty_sageo_id?.trim();

  if (!interactionId || !txHash || !actorSageoId || !counterpartySageoId) {
    throw new Error('interaction_id, tx_hash, actor_sageo_id and counterparty_sageo_id are required');
  }

  const eventType = input.event_type === 'response' ? 'response' : 'request';
  const timestamp =
    typeof input.timestamp === 'number' && Number.isFinite(input.timestamp)
      ? Math.floor(input.timestamp)
      : Math.floor(Date.now() / 1000);

  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR IGNORE INTO interaction_tx_events (
      interaction_id,
      tx_hash,
      event_type,
      is_sender,
      actor_sageo_id,
      counterparty_sageo_id,
      a2a_context_id,
      a2a_task_id,
      a2a_message_id,
      end_user_id,
      end_user_session_id,
      status_code,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    interactionId,
    txHash,
    eventType,
    typeof input.is_sender === 'boolean' ? (input.is_sender ? 1 : 0) : null,
    actorSageoId,
    counterpartySageoId,
    input.a2a_context_id?.trim() || null,
    input.a2a_task_id?.trim() || null,
    input.a2a_message_id?.trim() || null,
    input.end_user_id?.trim() || null,
    input.end_user_session_id?.trim() || null,
    typeof input.status_code === 'number' ? Math.trunc(input.status_code) : null,
    timestamp
  );
}

export function listInteractionTxEvents(interactionId: string): InteractionTxEventRecord[] {
  const normalizedId = interactionId.trim();
  if (!normalizedId) {
    return [];
  }

  const database = getDb();
  const stmt = database.prepare(`
    SELECT
      id,
      interaction_id,
      tx_hash,
      event_type,
      is_sender,
      actor_sageo_id,
      counterparty_sageo_id,
      a2a_context_id,
      a2a_task_id,
      a2a_message_id,
      end_user_id,
      end_user_session_id,
      status_code,
      created_at
    FROM interaction_tx_events
    WHERE interaction_id = ?
    ORDER BY id ASC
  `);

  const rows = stmt.all(normalizedId) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id),
    interaction_id: String(row.interaction_id || ''),
    tx_hash: String(row.tx_hash || ''),
    event_type: row.event_type === 'response' ? 'response' : 'request',
    is_sender:
      typeof row.is_sender === 'number'
        ? row.is_sender === 1
        : row.is_sender === null || row.is_sender === undefined
          ? undefined
          : Boolean(row.is_sender),
    actor_sageo_id: String(row.actor_sageo_id || ''),
    counterparty_sageo_id: String(row.counterparty_sageo_id || ''),
    a2a_context_id: row.a2a_context_id ? String(row.a2a_context_id) : undefined,
    a2a_task_id: row.a2a_task_id ? String(row.a2a_task_id) : undefined,
    a2a_message_id: row.a2a_message_id ? String(row.a2a_message_id) : undefined,
    end_user_id: row.end_user_id ? String(row.end_user_id) : undefined,
    end_user_session_id: row.end_user_session_id ? String(row.end_user_session_id) : undefined,
    status_code: typeof row.status_code === 'number' ? row.status_code : undefined,
    created_at: Number(row.created_at || 0),
    explorer_url: explorerUrlForTxHash(String(row.tx_hash || '')),
  }));
}

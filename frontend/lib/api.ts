// API client for Sageo frontend
// Connects to the Sageo Explorer API

const VITE_API_URL =
    typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_URL : undefined;
const API_BASE_URL = VITE_API_URL
    || (typeof process !== 'undefined' && process.env?.API_URL)
    || 'http://localhost:3001';

// Types matching API responses
export interface AgentSkill {
    id: string;
    name: string;
    description?: string;
    tags?: string;
    examples?: string[];
    inputModes?: string[];
    outputModes?: string[];
}

export interface AgentCard {
    name: string;
    description?: string;
    url?: string;
    version?: string;
    documentationUrl?: string;
    iconUrl?: string;
    protocolVersion?: string;
    provider?: {
        organization?: string;
        url?: string;
    };
    capabilities?: {
        streaming?: boolean;
        pushNotifications?: boolean;
        stateTransitionHistory?: boolean;
    };
    authentication?: {
        schemes?: string[];
        credentials?: string;
    };
    skills?: AgentSkill[];
}

export interface AgentProfile {
    sageo_id: string;
    owner: string;
    status: 'ACTIVE' | 'PAUSED' | 'DEPRECATED' | 'INACTIVE' | 'SUSPENDED';
    registered_at?: number;
    updated_at?: number;
    agent_card?: AgentCard;
}

const parseJsonArray = (value: unknown): string[] | undefined => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item));
    }
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item));
        }
    } catch {
        // Fall through to comma-split fallback.
    }

    return trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
};

const normalizeSkill = (raw: any): AgentSkill => ({
    id: raw?.id ?? raw?.skill_id ?? '',
    name: raw?.name ?? raw?.skill_name ?? '',
    description: raw?.description ?? raw?.skill_description,
    tags: raw?.tags ?? raw?.skill_tags,
    examples: parseJsonArray(raw?.examples ?? raw?.skill_examples),
    inputModes: parseJsonArray(raw?.input_modes ?? raw?.skill_input_modes ?? raw?.inputModes),
    outputModes: parseJsonArray(raw?.output_modes ?? raw?.skill_output_modes ?? raw?.outputModes),
});

const normalizeCard = (raw: any): AgentCard => ({
    name: raw?.name ?? '',
    description: raw?.description,
    url: raw?.url,
    version: raw?.version,
    documentationUrl: raw?.documentationUrl ?? raw?.documentation_url,
    iconUrl: raw?.iconUrl ?? raw?.icon_url,
    protocolVersion: raw?.protocolVersion ?? raw?.protocol_version,
    capabilities: raw?.capabilities
        ? {
            streaming: raw.capabilities.streaming,
            pushNotifications: raw.capabilities.pushNotifications ?? raw.capabilities.push_notifications,
            stateTransitionHistory:
                raw.capabilities.stateTransitionHistory ?? raw.capabilities.state_transition_history,
        }
        : undefined,
    skills: Array.isArray(raw?.skills) ? raw.skills.map(normalizeSkill) : undefined,
});

const normalizeProfile = (raw: any): AgentProfile => ({
    sageo_id: raw?.sageo_id ?? '',
    owner: raw?.owner ?? '',
    status: raw?.status ?? 'INACTIVE',
    registered_at: raw?.registered_at ?? raw?.created_at,
    updated_at: raw?.updated_at,
    agent_card: raw?.agent_card ? normalizeCard(raw.agent_card) : undefined,
});

// API Functions

export async function fetchAgents(params?: {
    status?: string;
    streaming?: boolean;
    tags?: string;
    limit?: number;
    offset?: number;
}): Promise<AgentProfile[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.streaming !== undefined) searchParams.set('streaming', String(params.streaming));
    if (params?.tags) searchParams.set('tags', params.tags);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const url = `${API_BASE_URL}/agents${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeProfile) : [];
}

export async function searchAgents(query: string, limit?: number): Promise<AgentProfile[]> {
    const searchParams = new URLSearchParams({ q: query });
    if (limit) searchParams.set('limit', String(limit));

    const res = await fetch(`${API_BASE_URL}/agents/search?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Failed to search agents: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeProfile) : [];
}

export async function fetchAgentProfile(sageoId: string): Promise<AgentProfile | null> {
    const res = await fetch(`${API_BASE_URL}/agents/${sageoId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch agent profile: ${res.status}`);
    const data = await res.json();
    return data ? normalizeProfile(data) : null;
}

export async function fetchAgentCard(sageoId: string): Promise<AgentCard | null> {
    const res = await fetch(`${API_BASE_URL}/agents/${sageoId}/card`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch agent card: ${res.status}`);
    const data = await res.json();
    return data ? normalizeCard(data) : null;
}

export async function fetchAgentsBySkill(skillId: string, limit?: number): Promise<AgentProfile[]> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', String(limit));

    const url = `${API_BASE_URL}/agents/by-skill/${skillId}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch agents by skill: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeProfile) : [];
}

export async function fetchAgentByUrl(url: string): Promise<AgentProfile | null> {
    const res = await fetch(`${API_BASE_URL}/agents/by-url?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Failed to fetch agent by URL: ${res.status}`);
    const data = await res.json();
    return data ? normalizeProfile(data) : null;
}

// ============== INTERACTION TYPES ==============

export interface InteractionRecord {
    interaction_id: string;
    caller_sageo_id: string;
    callee_sageo_id: string;
    request_hash: string;
    response_hash: string;
    intent: string;
    status_code: number;
    timestamp: number;
    a2a_context_id?: string;
    a2a_task_id?: string;
    a2a_message_id?: string;
    end_user_id?: string;
    end_user_session_id?: string;
}

export interface AgentInteractionStats {
    total_requests_sent: number;
    total_requests_received: number;
    total_responses_sent: number;
    success_count: number;
    unique_counterparties: number;
    last_interaction_at: number;
}

// ============== INTERACTION API FUNCTIONS ==============

export async function fetchRecentInteractions(limit: number = 10): Promise<InteractionRecord[]> {
    const res = await fetch(`${API_BASE_URL}/interactions/recent?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch recent interactions: ${res.status}`);
    const data = await res.json();
    return data.interactions || [];
}

export async function fetchInteraction(
    interactionId: string,
    sageoId: string
): Promise<InteractionRecord | null> {
    const res = await fetch(`${API_BASE_URL}/interactions/${interactionId}?sageo_id=${encodeURIComponent(sageoId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch interaction: ${res.status}`);
    return res.json();
}

export async function fetchAgentInteractions(
    sageoId: string,
    limit: number = 20,
    offset: number = 0
): Promise<{ interactions: InteractionRecord[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/agents/${sageoId}/interactions?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(`Failed to fetch agent interactions: ${res.status}`);
    return res.json();
}

export async function fetchAgentStats(sageoId: string): Promise<AgentInteractionStats | null> {
    const res = await fetch(`${API_BASE_URL}/agents/${sageoId}/stats`);
    if (!res.ok) throw new Error(`Failed to fetch agent stats: ${res.status}`);
    const data = await res.json();
    return data.stats || null;
}

export async function verifyInteraction(
    interactionId: string,
    sageoId: string
): Promise<{ verified: boolean; on_chain_hash: string; timestamp: number } | null> {
    const res = await fetch(`${API_BASE_URL}/interactions/${interactionId}/verify?sageo_id=${encodeURIComponent(sageoId)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to verify interaction: ${res.status}`);
    return res.json();
}

export interface RegisterAgentPayload {
  name: string;
  description?: string;
  version: string;
  url?: string;
  tags?: string[];
}

export interface RegisterAgentResponse {
  sageo_id: string;
  mnemonic?: string;
  wallet_address?: string;
  warning?: string;
}

export async function registerAgent(payload: RegisterAgentPayload): Promise<RegisterAgentResponse> {
  const res = await fetch(`${API_BASE_URL}/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to register agent: ${res.status}`);
  return res.json();
}

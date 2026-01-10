// API client for Sageo frontend
// Connects to the Sageo Explorer API

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.API_URL)
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
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    registered_at?: number;
    updated_at?: number;
    agent_card?: AgentCard;
}

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
    return res.json();
}

export async function searchAgents(query: string, limit?: number): Promise<AgentProfile[]> {
    const searchParams = new URLSearchParams({ q: query });
    if (limit) searchParams.set('limit', String(limit));

    const res = await fetch(`${API_BASE_URL}/agents/search?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`Failed to search agents: ${res.status}`);
    return res.json();
}

export async function fetchAgentProfile(sageoId: string): Promise<AgentProfile | null> {
    const res = await fetch(`${API_BASE_URL}/agents/${sageoId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch agent profile: ${res.status}`);
    return res.json();
}

export async function fetchAgentCard(sageoId: string): Promise<AgentCard | null> {
    const res = await fetch(`${API_BASE_URL}/agents/${sageoId}/card`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch agent card: ${res.status}`);
    return res.json();
}

export async function fetchAgentsBySkill(skillId: string, limit?: number): Promise<AgentProfile[]> {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', String(limit));

    const url = `${API_BASE_URL}/agents/by-skill/${skillId}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch agents by skill: ${res.status}`);
    return res.json();
}

export async function fetchAgentByUrl(url: string): Promise<AgentProfile | null> {
    const res = await fetch(`${API_BASE_URL}/agents/by-url?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Failed to fetch agent by URL: ${res.status}`);
    return res.json();
}

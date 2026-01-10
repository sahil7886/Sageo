# Sageo MVP Specification

This document clarifies the MVP implementation choices for Sageo, documenting deviations from the full A2A spec and their rationale.

---

## Data Type Mappings

### AgentSkill

| A2A Spec Field | MVP Contract Field | Notes |
|----------------|-------------------|-------|
| `id: string` | `id: String` | ✅ Matches |
| `name: string` | `name: String` | ✅ Matches |
| `description: string` | `description: String` | ✅ Matches |
| `tags: string` | `tags: String` | ✅ Matches |
| `examples?: string[]` | `examples: String` | JSON array as string (Cocolang limitation) |
| `inputModes?: string[]` | `input_modes: String` | JSON array as string |
| `outputModes?: string[]` | `output_modes: String` | JSON array as string |
| `security?: Record<string, string[]>[]` | *omitted* | MVP scope - not implemented |

### AgentCapabilities

| A2A Spec Field | MVP Contract Field | Notes |
|----------------|-------------------|-------|
| `streaming?: boolean` | `streaming: Bool` | ✅ Matches |
| `pushNotifications?: boolean` | `push_notifications: Bool` | ✅ Matches |
| `stateTransitionHistory?: boolean` | `state_transition_history: Bool` | ✅ Matches |
| `extensions?: AgentExtension[]` | *omitted* | MVP scope - not implemented |

### AgentCard

| A2A Spec Field | MVP Contract Field | Notes |
|----------------|-------------------|-------|
| `name: string` | `name: String` | ✅ Matches |
| `description: string` | `description: String` | ✅ Matches |
| `version: string` | `version: String` | ✅ Matches |
| `url: string` | `url: String` | ✅ Matches |
| `protocolVersion: string` | `protocol_version: String` | ✅ Matches |
| `defaultInputModes: string[]` | `default_input_modes: String` | JSON array as string |
| `defaultOutputModes: string[]` | `default_output_modes: String` | JSON array as string |
| `capabilities: AgentCapabilities1` | `capabilities: AgentCapabilities` | ✅ Matches |
| `skills: AgentSkill[]` | `skills: []AgentSkill` | ✅ Stored correctly (see API note below) |
| `iconUrl?: string` | `icon_url: String` | ✅ Matches |
| `documentationUrl?: string` | `documentation_url: String` | ✅ Matches |
| `preferredTransport?: string` | `preferred_transport: String` | ✅ Matches |
| `provider?: AgentProvider` | *omitted* | MVP scope - not implemented |
| `additionalInterfaces?: AgentInterface[]` | *omitted* | MVP scope - not implemented |
| `securitySchemes?: Record<string, SecurityScheme>` | *omitted* | MVP scope - not implemented |
| `security?: Record<string, string[]>[]` | *omitted* | MVP scope - not implemented |
| `supportsAuthenticatedExtendedCard?: boolean` | *omitted* | MVP scope - not implemented |
| `signatures?: AgentCardSignature[]` | *omitted* | MVP scope - not implemented |

### AgentProfile (Sageo-specific)

| Spec Field | Contract Field | Notes |
|------------|----------------|-------|
| `sageo_id: string` | `sageo_id: String` | ✅ Matches |
| `owner: string` | `owner: String` | ✅ Matches |
| `status: AgentStatus` | `status: String` | "ACTIVE" \| "PAUSED" \| "DEPRECATED" |
| `created_at: timestamp` | `created_at: U64` | ✅ Matches |
| `updated_at: timestamp` | `updated_at: U64` | ✅ Matches |
| `agent_card: AgentCard` | `agent_card: AgentCard` | ✅ Matches |

---

## Contract API Endpoints

### SageoIdentityLogic

| Endpoint | Status | Notes |
|----------|--------|-------|
| `Deploy()` | ✅ Implemented | Initializes contract state |
| `Enlist()` | ✅ Implemented | Registers sender to use the system |
| `RegisterAgent(...)` | ✅ Implemented | Creates agent with full AgentCard |
| `AddSkill(...)` | ✅ Implemented | Adds skill to agent's card |
| `GetAgentProfile(sageo_id)` | ✅ Implemented | Returns profile metadata (no card) |
| `GetAgentCard(sageo_id)` | ✅ Implemented | Returns card **without skills** (see limitation) |
| `GetAgentSkills(sageo_id)` | ✅ Implemented | Returns skills array separately |
| `GetAgentByUrl(url)` | ✅ Implemented | Returns profile metadata by URL |
| `GetAllAgentIds()` | ✅ Implemented | Returns all agent IDs |
| `GetAgentCount()` | ✅ Implemented | Returns total agent count |
| `UpdateAgentCard(...)` | ✅ Implemented | Updates card fields (owner only) |
| `SetAgentStatus(...)` | ✅ Implemented | Updates status (owner only) |

#### Known Limitation: GetAgentCard and Skills

**Issue:** Cocolang cannot return `AgentCard` with populated `skills: []AgentSkill` array from a static endpoint due to varray serialization limitations ("failed to write varray size: slot is read-only").

**Solution:**
- Skills are stored correctly inside `agent_card.skills` per A2A spec
- `GetAgentCard` returns the card without skills populated
- `GetAgentSkills` returns skills separately
- Client code should call both endpoints and merge results

### SageoInteractionLogic

| Endpoint | Status | Notes |
|----------|--------|-------|
| All endpoints | ❌ Not deployed | Contract deployment fails (to be investigated) |

---

## REST API Endpoints (SageoExplorer)

### Implemented (MVP)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /agents/:sageo_id` | Returns `AgentProfileMeta` |
| `GET /agents/:sageo_id/card` | Returns `AgentCard` (without skills) |
| `GET /agents/:sageo_id/ping` | Ping endpoint |

### Placeholder (Future)

| Endpoint | Description |
|----------|-------------|
| `GET /agents` | List agents with filtering |
| `GET /agents/search` | Search agents |
| `GET /agents/by-skill/:skill_id` | Find agents by skill |
| `GET /agents/by-url` | Find agent by URL |
| `GET /agents/:sageo_id/interactions` | Agent interactions |
| `GET /agents/:sageo_id/stats` | Agent statistics |
| `GET /interactions/:id` | Get interaction |
| `GET /interactions/:id/verify` | Verify interaction |

---

## SDK Classes (MVP Scope)

### SageoClient

The main client for integrating Sageo with A2A agents.

**MVP Methods:**
| Method | Status | Notes |
|--------|--------|-------|
| `constructor(moi_rpc_url, agent_key, agent_card)` | MVP | Initialize client |
| `get_my_profile()` | MVP | Returns agent's Sageo profile |
| `wrap_a2a_client(a2a_client)` | MVP | Wraps A2A client for logging |
| `wrap_request_handler(handler)` | Deferred | Server-side wrapper |
| `log_interaction_manually(...)` | Deferred | Manual logging fallback |

### SageoA2AClientWrapper

Drop-in replacement for A2AClient with automatic Sageo logging.

**MVP Methods:**
| Method | Status | Notes |
|--------|--------|-------|
| `send_message(request)` | MVP | Logs request to MOI |
| `send_message_streaming(request)` | Deferred | Streaming support |
| `get_task(task_id)` | Deferred | Passthrough, no logging |

### SageoRequestHandler

Server-side handler wrapper (wraps DefaultRequestHandler).

**Status:** Deferred for MVP - depends on SageoInteractionLogic deployment.

### SageoTraceMetadata

Metadata injected into A2A message extensions for tracing.

**MVP Fields:**
| Field | Status | Notes |
|-------|--------|-------|
| `conversation_id` | MVP | Maps to A2A contextId |
| `interaction_id` | MVP | Per request/response pair |
| `caller_sageo_id` | MVP | Caller agent ID |
| `callee_sageo_id` | MVP | Callee agent ID |
| `intent` | MVP | Short description |
| `a2a.contextId/taskId/messageId` | MVP | A2A correlation |
| `end_user.*` | Deferred | End-user context propagation |
| `a2a_client_timestamp_ms` | Deferred | Client timing |

---

## Design Decisions

### 1. Array Fields as JSON Strings

**Decision:** Store `string[]` fields as JSON-encoded strings (e.g., `'["text","voice"]'`).

**Rationale:** Cocolang has limitations with `[]String` in certain contexts. JSON strings provide reliable storage and can be parsed client-side.

**Affected Fields:**
- `default_input_modes`, `default_output_modes`
- `examples`, `input_modes`, `output_modes` (in AgentSkill)

### 2. Skills Stored in AgentCard, Fetched Separately

**Decision:** Skills are stored inside `agent_card.skills` per A2A spec, but fetched via separate `GetAgentSkills` endpoint.

**Rationale:** Cocolang cannot serialize nested arrays in static endpoint return values. Data structure matches spec; only the API splits the retrieval.

### 3. Profile/Card Split for Efficiency

**Decision:** `GetAgentProfile` returns metadata only; `GetAgentCard` returns card details.

**Rationale:** Prevents overfetching when only profile metadata is needed.

### 4. Omitted Optional Fields

**Decision:** Several optional A2A fields are omitted from MVP:
- `provider`, `additionalInterfaces`, `securitySchemes`, `security`, `signatures`

**Rationale:** These are optional in A2A spec and add significant complexity. Can be added in future versions.

---

## Client Usage Pattern

```typescript
// Initialize
const sageoClient = new SageoClient(moiRpcUrl, agentKey, myAgentCard);

// Get agent card with skills (requires two calls due to limitation)
const card = await sageoClient.getAgentCard(sageoId);
const skills = await sageoClient.getAgentSkills(sageoId);
const fullCard = { ...card, skills };

// Wrap A2A client for automatic logging
const wrappedClient = sageoClient.wrapA2AClient(originalA2AClient);
await wrappedClient.sendMessage(request); // Automatically logged to MOI
```

---

## Future Enhancements

1. **SageoInteractionLogic deployment** - Fix deployment issues
2. **Full AgentCard return** - Investigate Cocolang workarounds for varray serialization
3. **Optional A2A fields** - Add provider, security, signatures support
4. **SageoRequestHandler** - Server-side logging for receiving agents
5. **End-user context propagation** - Track user sessions through agent chains

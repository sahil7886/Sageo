# Sageo Explorer API - Implementation Workflow

This document provides a comprehensive overview of the Sageo Explorer API implementation, including all completed features, architecture, request flows, and technical details.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server Initialization](#server-initialization)
3. [Request Processing Pipeline](#request-processing-pipeline)
4. [Implemented Endpoints](#implemented-endpoints)
5. [Core Utilities](#core-utilities)
6. [Error Handling](#error-handling)
7. [MOI Blockchain Integration](#moi-blockchain-integration)
8. [Placeholder Endpoints](#placeholder-endpoints)
9. [Development Workflow](#development-workflow)

---

## 🏗️ Architecture Overview

### Directory Structure

```
api/
├── src/
│   ├── index.ts              # Server entry point & initialization
│   ├── app.ts                # Express app setup & middleware
│   ├── lib/
│   │   ├── config.ts         # Configuration management
│   │   ├── deps.ts           # Contract dependency management
│   │   ├── contract.ts       # MOI blockchain RPC client
│   │   ├── errors.ts         # Error class definitions
│   │   └── validate.ts      # Input validation utilities
│   └── routes/
│       ├── agents.ts         # Agent-related endpoints
│       └── interactions.ts   # Interaction-related endpoints
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

### Technology Stack

- **Runtime**: Node.js 18+ (uses native `fetch` API)
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.8
- **Blockchain**: MOI (via JSON-RPC)

---

## 🚀 Server Initialization

### Startup Sequence (`src/index.ts`)

```typescript
1. Load Configuration
   ├── Read environment variables
   ├── Validate required variables (MOI_RPC_URL)
   ├── Check production requirements (contract addresses)
   └── Exit with error if validation fails

2. Initialize Dependencies
   ├── Store identity contract address
   └── Store interaction contract address

3. Start Express Server
   ├── Listen on configured PORT
   ├── Log configuration details
   └── Register graceful shutdown handlers

4. Graceful Shutdown
   ├── Handle SIGTERM
   ├── Handle SIGINT
   └── Close server gracefully
```

### Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MOI_RPC_URL` | ✅ Always | - | MOI blockchain RPC endpoint URL |
| `IDENTITY_LOGIC_ADDRESS` | ✅ Production | `null` | Identity contract address on MOI |
| `INTERACTION_LOGIC_ADDRESS` | ✅ Production | `null` | Interaction contract address on MOI |
| `PORT` | ❌ | `3001` | Server listening port |
| `NODE_ENV` | ❌ | `development` | Environment mode |

---

## 🔄 Request Processing Pipeline

### Middleware Stack

```
1. JSON Body Parser
   └── Parses JSON request bodies

2. Request Logger
   └── Logs: [timestamp] METHOD /path

3. Route Handlers
   └── Process specific endpoints

4. Error Handler
   ├── AppError → HTTP response with error code
   └── Unknown errors → 500 INTERNAL_ERROR

5. 404 Handler
   └── Unknown routes → 404 NOT_FOUND
```

### Request Flow Example: `GET /agents/abc123`

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request Arrives                                           │
│    GET /agents/abc123                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Request Logger Middleware                                 │
│    Logs: [2024-01-15T10:30:00.000Z] GET /agents/abc123      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Route Handler: GET /:sageo_id                            │
│    ├── Extract param: sageo_id = "abc123"                  │
│    ├── Validate: validateSageoId("abc123")                  │
│    │   └── ✓ Non-empty string                               │
│    ├── Check Contract: requireContract('identity')          │
│    │   ├── If missing → 501 NOT_IMPLEMENTED                │
│    │   └── If present → Continue                            │
│    └── Get Config: getConfig()                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. MOI Contract Call: readLogic()                           │
│    POST to MOI_RPC_URL                                       │
│    {                                                         │
│      jsonrpc: "2.0",                                        │
│      method: "moi_readLogic",                               │
│      params: {                                               │
│        address: <identity_contract_address>,                │
│        method: "get_agent_by_id",                           │
│        args: ["abc123"]                                     │
│      }                                                       │
│    }                                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Response Handling                                         │
│    ├── If null/undefined → 404 NOT_FOUND                   │
│    ├── If not object → 500 CHAIN_ERROR                      │
│    └── If valid → 200 <agent_profile_json>                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Error Handler (if error occurred)                         │
│    Converts AppError to HTTP response:                      │
│    {                                                         │
│      error: {                                                │
│        code: "ERROR_CODE",                                  │
│        message: "Error message"                              │
│      }                                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Implemented Endpoints

### Base Endpoints

#### `GET /health`
- **Status**: ✅ Fully Implemented
- **Contract Required**: ❌ None
- **Response**: `{ ok: true }`
- **Use Case**: Health check for load balancers/monitoring

---

### Agent Endpoints (`/agents`)

#### `GET /agents/:sageo_id/ping`
- **Status**: ✅ Fully Implemented
- **Contract Required**: ❌ None
- **Validation**: None (simple ping)
- **Response**: 
  ```json
  {
    "ok": true,
    "sageo_id": "<sageo_id>"
  }
  ```
- **Use Case**: Quick agent endpoint availability check

#### `GET /agents/:sageo_id`
- **Status**: ✅ Fully Implemented
- **Contract Required**: ✅ Identity contract
- **Validation**: 
  - `sageo_id` must be non-empty string
- **MOI Call**: `identity.read('get_agent_by_id', sageo_id)`
- **Response Codes**:
  - `200` - Agent found, returns full `AgentProfile` JSON
  - `400` - Invalid `sageo_id` format
  - `404` - Agent not found
  - `501` - Identity contract not configured
  - `500` - Chain error or malformed response
- **Response Format** (200):
  ```json
  {
    "sageo_id": "string",
    "owner": "string",
    "status": "AgentStatus",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "agent_card": { /* A2A AgentCard */ }
  }
  ```
- **Error Format** (404):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Agent not found"
    }
  }
  ```

#### `GET /agents/:sageo_id/card`
- **Status**: ✅ Fully Implemented
- **Contract Required**: ✅ Identity contract
- **Validation**: 
  - `sageo_id` must be non-empty string
- **MOI Call**: `identity.read('get_agent_by_id', sageo_id)`
- **Response Codes**:
  - `200` - Agent found, returns `agent_card` only
  - `400` - Invalid `sageo_id` format
  - `404` - Agent not found
  - `501` - Identity contract not configured
  - `500` - Chain error, malformed response, or missing `agent_card` field
- **Response Format** (200):
  ```json
  {
    /* A2A AgentCard object */
  }
  ```

---

### Interaction Endpoints (`/interactions`)

#### `GET /interactions/ping`
- **Status**: ✅ Fully Implemented
- **Contract Required**: ❌ None
- **Response**: 
  ```json
  {
    "ok": true,
    "route": "interactions"
  }
  ```

#### `GET /interactions`
- **Status**: ✅ Fully Implemented
- **Contract Required**: ✅ Interaction contract
- **Response**: `{ ok: true }`
- **Use Case**: Contract availability check

---

## 🔧 Core Utilities

### Configuration Management (`src/lib/config.ts`)

**Functions:**
- `loadConfig()`: Loads and validates configuration from environment
- `getConfig()`: Returns initialized config (throws if not loaded)

**Features:**
- Validates required variables
- Production mode enforces contract addresses
- Type-safe configuration interface

### Dependency Management (`src/lib/deps.ts`)

**Functions:**
- `initializeDeps(config)`: Initializes contract addresses from config
- `getDeps()`: Returns current dependency state
- `requireContract(name)`: Validates contract is configured, returns address

**Behavior:**
- Throws `501 NOT_IMPLEMENTED` if contract not configured
- Used as gatekeeper for contract-dependent endpoints

### MOI Contract Client (`src/lib/contract.ts`)

**Functions:**
- `readLogic(config, address, method, ...args)`: Calls read-only MOI contract method

**Implementation:**
- Makes JSON-RPC POST request to `MOI_RPC_URL`
- Uses `moi_readLogic` RPC method
- Handles network errors, JSON parsing errors
- Returns `null` if contract returns null/undefined
- Wraps all errors as `500 CHAIN_ERROR`

**Request Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "moi_readLogic",
  "params": {
    "address": "<contract_address>",
    "method": "<method_name>",
    "args": [/* method arguments */]
  }
}
```

### Validation Utilities (`src/lib/validate.ts`)

**Functions:**
- `validateSageoId(id)`: Ensures non-empty string, trims whitespace
- `validateLimit(limit?)`: Validates pagination limit (1-100, default 50)
- `validateOffset(offset?)`: Validates pagination offset (≥0, default 0)

**Error Handling:**
- Throws `ValidationError` (400) for invalid input
- Returns defaults for optional parameters

### Error Classes (`src/lib/errors.ts`)

**Error Hierarchy:**
```
AppError (base)
├── ValidationError (400)
├── NotFoundError (404)
└── ApiError (custom status codes)
```

**Error Response Format:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid input parameters
- `NOT_FOUND` (404) - Resource not found
- `NOT_IMPLEMENTED` (501) - Contract not configured
- `CHAIN_ERROR` (500) - MOI blockchain/contract error
- `INTERNAL_ERROR` (500) - Unexpected server error

---

## 🛡️ Error Handling

### Error Flow

```
Route Handler
    │
    ├─→ ValidationError (400)
    │   └─→ Error Handler → 400 { error: { code: "VALIDATION_ERROR", ... } }
    │
    ├─→ NotFoundError (404)
    │   └─→ Error Handler → 404 { error: { code: "NOT_FOUND", ... } }
    │
    ├─→ ApiError (501)
    │   └─→ Error Handler → 501 { error: { code: "NOT_IMPLEMENTED", ... } }
    │
    ├─→ ApiError (500)
    │   └─→ Error Handler → 500 { error: { code: "CHAIN_ERROR", ... } }
    │
    └─→ Unknown Error
        └─→ Error Handler → 500 { error: { code: "INTERNAL_ERROR", ... } }
```

### Type-Safe Guards

All contract responses are validated:
- Null/undefined check → 404
- Object type check → 500 if not object
- Field existence check (for `/card` endpoint) → 500 if missing

---

## ⛓️ MOI Blockchain Integration

### RPC Communication

**Endpoint**: Configured via `MOI_RPC_URL` environment variable

**Method**: `moi_readLogic`

**Request Flow:**
1. Route handler calls `readLogic(config, address, method, ...args)`
2. Function constructs JSON-RPC request
3. POST request to MOI RPC endpoint
4. Parse JSON response
5. Check for RPC errors
6. Return result or throw `CHAIN_ERROR`

**Error Scenarios:**
- Network failure → `CHAIN_ERROR`
- HTTP error status → `CHAIN_ERROR`
- JSON-RPC error → `CHAIN_ERROR`
- Invalid JSON response → `CHAIN_ERROR`

### Contract Methods Used

**Identity Contract:**
- `get_agent_by_id(sageo_id: string) → AgentProfile | null`

**Interaction Contract:**
- (Not yet implemented)

---

## 🚧 Placeholder Endpoints

These endpoints exist but return placeholder responses:

### Agent Endpoints

- `GET /agents` → Returns `[]` (requires identity contract)
- `GET /agents/search` → Returns `[]` (requires identity contract)
- `GET /agents/by-skill/:skill_id` → Returns `[]` (requires identity contract)
- `GET /agents/by-url` → Returns `null` (requires identity contract)
- `GET /agents/:sageo_id/interactions` → Returns `[]` (requires interaction contract)
- `GET /agents/:sageo_id/stats` → Returns `null` (requires interaction contract)

### Interaction Endpoints

- `GET /interactions/:interaction_id` → Returns `null` (requires interaction contract)
- `GET /interactions/:interaction_id/verify` → Returns `{ valid: false }` (requires interaction contract)

---

## 💻 Development Workflow

### Setup

```bash
cd api
npm install
```

### Development Mode

```bash
npm run dev
```

- Uses `tsx watch` for hot reloading
- Server restarts on file changes
- Runs on port 3001 (or `PORT` env var)

### Build

```bash
npm run build
```

- Compiles TypeScript to JavaScript
- Outputs to `dist/` directory
- Generates type definitions (`.d.ts`)

### Production

```bash
npm start
```

- Runs compiled code from `dist/`
- Requires all environment variables set

### Environment Setup

**Development:**
```bash
export MOI_RPC_URL="https://moi-rpc.example.com"
export PORT=3001
export NODE_ENV=development
```

**Production:**
```bash
export MOI_RPC_URL="https://moi-rpc.example.com"
export IDENTITY_LOGIC_ADDRESS="0x..."
export INTERACTION_LOGIC_ADDRESS="0x..."
export PORT=3001
export NODE_ENV=production
```

---

## 📊 Implementation Status

### ✅ Completed Features

- [x] Server initialization and configuration
- [x] Express middleware setup (JSON parser, logging, error handling)
- [x] Health check endpoint
- [x] Agent profile retrieval by ID
- [x] Agent card retrieval
- [x] Agent ping endpoint
- [x] MOI blockchain RPC integration
- [x] Contract dependency gating (501 errors)
- [x] Input validation
- [x] Error handling and response formatting
- [x] Request logging
- [x] Graceful shutdown

### 🚧 Pending Features

- [ ] Agent listing (`GET /agents`)
- [ ] Agent search (`GET /agents/search`)
- [ ] Agents by skill (`GET /agents/by-skill/:skill_id`)
- [ ] Agent by URL (`GET /agents/by-url`)
- [ ] Agent interactions (`GET /agents/:sageo_id/interactions`)
- [ ] Agent statistics (`GET /agents/:sageo_id/stats`)
- [ ] Interaction details (`GET /interactions/:interaction_id`)
- [ ] Interaction verification (`GET /interactions/:interaction_id/verify`)

---

## 🔍 Testing Endpoints

### Health Check
```bash
curl http://localhost:3001/health
# Response: {"ok":true}
```

### Agent Ping
```bash
curl http://localhost:3001/agents/test123/ping
# Response: {"ok":true,"sageo_id":"test123"}
```

### Get Agent Profile
```bash
curl http://localhost:3001/agents/abc123
# Response: { full agent profile JSON }
# Or: {"error":{"code":"NOT_FOUND","message":"Agent not found"}}
```

### Get Agent Card
```bash
curl http://localhost:3001/agents/abc123/card
# Response: { agent_card JSON }
# Or: {"error":{"code":"NOT_FOUND","message":"Agent not found"}}
```

---

## 📝 Notes

- All contract-dependent endpoints return `501 NOT_IMPLEMENTED` if contracts are not configured
- Error responses follow consistent format: `{ error: { code, message } }`
- Request logging includes timestamp, method, and path
- TypeScript strict mode enabled for type safety
- All async route handlers use try/catch with `next(error)` for error propagation

---

**Last Updated**: Based on current implementation as of latest commit
**Version**: 0.1.0


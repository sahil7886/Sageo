# SageoExplorer API

REST API server for the Sageo agent discovery and interaction viewing platform.

## Quick Start

```bash
cd api
npm install
npm run dev
```

The server will start on port 3001 (or the port specified in the `PORT` environment variable).

## Documentation

For detailed implementation workflow, see [WORKFLOW.md](./WORKFLOW.md)

## Setup

### Development

```bash
npm install
npm run dev
```

## Local Testing Flow

Use the deployment and mock data scripts to seed contracts for local testing.

```bash
cd api
tsx scripts/deploy.ts
```

Update the contract IDs printed by the deploy script in `api/src/lib/moi-client.ts`, then run:

```bash
tsx scripts/create_mock_data.ts
```

This seeds mock agents and mock interactions in one step.

### Production

```bash
npm run build
npm start
```

## Environment Variables

### Required
- `MOI_RPC_URL` - MOI blockchain RPC endpoint URL

### Required in Production
- `IDENTITY_LOGIC_ADDRESS` - Identity contract address on MOI
- `INTERACTION_LOGIC_ADDRESS` - Interaction contract address on MOI

### Optional
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (default: development)

## Implemented Endpoints

### Base
- `GET /health` - Health check endpoint

### Agents
- `GET /agents/:sageo_id/ping` - Ping agent endpoint
- `GET /agents/:sageo_id` - Get agent profile by ID ✅
- `GET /agents/:sageo_id/card` - Get agent card only ✅

### Interactions
- `GET /interactions/ping` - Ping interactions endpoint
- `GET /interactions` - Check interaction contract availability

## Placeholder Endpoints

These endpoints exist but return placeholder responses:
- `GET /agents` - List agents
- `GET /agents/search` - Search agents
- `GET /agents/by-skill/:skill_id` - Get agents by skill
- `GET /agents/by-url` - Get agent by URL
- `GET /agents/:sageo_id/interactions` - Get agent interactions
- `GET /agents/:sageo_id/stats` - Get agent statistics
- `GET /interactions/:interaction_id?sageo_id=...` - Get interaction by ID (agent scope required)
- `GET /interactions/:interaction_id/verify?sageo_id=...` - Verify interaction

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400) - Invalid input
- `NOT_FOUND` (404) - Resource not found
- `NOT_IMPLEMENTED` (501) - Contract not configured
- `CHAIN_ERROR` (500) - MOI blockchain error
- `INTERNAL_ERROR` (500) - Server error

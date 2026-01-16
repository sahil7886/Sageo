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

### Environment Variables

Create a `.env` file in the `api/` directory with:

```bash
VOYAGE_API_KEY=your_voyage_api_key_here
```

**To get your Voyage API key:**
1. Visit [https://voyage.moi.technology/](https://voyage.moi.technology/)
2. Sign up or log in to your account
3. Navigate to your profile/settings → API Keys
4. Create a new API key (name it "Faucet" or similar)
5. Copy the key and add it to your `.env` file

This API key is **required** for the faucet to automatically fund test wallets during agent registration.

## Local Testing Flow

Use the deployment and mock data scripts to seed contracts for local testing.

### Step 1: Deploy Contracts

```bash
cd api
tsx scripts/deploy.ts
```

Update the contract IDs printed by the deploy script in `api/src/lib/moi-client.ts`.

### Step 2: Register Agents with Independent Wallets

**Run the registration script:**

```bash
tsx scripts/register_agents.ts
```

**The script will:**
1. Generate unique mnemonics and wallets for each test agent
2. Display wallet addresses that need funding
3. Pause and wait for you to manually fund the wallets
4. Register agents on-chain after you press Enter
5. Save agent info (including mnemonics) to `agent_mnemonics.json`

**Manual Funding Steps:**
1. The script will display wallet addresses
2. Go to https://voyage.moi.technology/faucet
3. Fund each displayed wallet with ~10,000 tokens
4. Return to terminal and press Enter to continue

**Note:** Auto-funding is disabled due to MOI SDK bug (`ERROR_NONCE_EXPIRED`)

**Important:** Each agent has an independent wallet for true autonomy and isolated state.

### Step 3: Create Mock Interactions

```bash
tsx scripts/create_mock_data.ts
```

This script:
- Loads agent mnemonics from `agent_mnemonics.json`
- Creates wallets for each agent
- Enlists agents in InteractionLogic
- Logs sample interactions between agents

### Step 4: Test the API

```bash
./scripts/test_api.sh
```

Runs comprehensive API tests to verify all endpoints work correctly.

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
- `POST /agents/register` - Register new agent with independent wallet ✅
  - Generates mnemonic and wallet for the agent
  - Returns: `sageo_id`, `mnemonic`, `wallet_address`, `warning`
  - **Important:** Mnemonic is returned only once - user must save it securely

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

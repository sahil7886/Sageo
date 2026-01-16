# Sageo A2A Multi-Agent Flow

This script spins up two local A2A agents (WeatherBot + StockTrader), wraps them
with Sageo logging, and sends a user message that triggers a multi-agent flow.

It uses agent_1 and agent_2 from `api/scripts/agent_mnemonics.json`.

## Setup

```bash
cd a2a-flow
npm install
```

## Run

```bash
npm run start
```

## Optional Env Vars

- `MOI_RPC_URL` (default: `https://voyage-rpc.moi.technology`)
- `AGENT1_PORT` (default: `4101`)
- `AGENT2_PORT` (default: `4102`)
- `USER_MESSAGE` (default: "Plan a trip to Paris and ask StockTrader for AAPL sentiment.")

## What You Should See

- WeatherBot server and StockTrader server start locally.
- End user sends a message to WeatherBot.
- WeatherBot calls StockTrader via the SageoClient wrapper.
- Logs should be written to the Sageo Interaction contract for agent_1 and agent_2.

You can verify interactions via the API:

```bash
curl http://localhost:3001/agents/agent_1/interactions
curl http://localhost:3001/agents/agent_2/interactions
```

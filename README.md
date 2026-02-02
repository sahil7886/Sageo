# Sageo

A trust and discovery layer for AI agents built on MOI blockchain.

## Quickstart

### 1. Setup env variables
Create a .env file in your backend directory matching the format in env.example. The Moi mnenomic is optional. If you just copy env.example into .env, it should work.

### 2. Run backend
`cd backend`\
`npm install`\
`npm run dev`

### 3. Run frontend
`cd frontend`\
`npm install`\
`npm run dev`

## Overview

Sageo adds verifiable identity, interaction tracking, and agent discovery on top of Google's A2A (Agent-to-Agent) protocol. Think of it like a blockchain explorer, but for tracking and verifying interactions between AI agents.

### The Problem

AI agents can communicate through protocols like A2A and MCP, but these systems only provide connectivity—not:

- **Identity**: No way to verify who an agent is
- **Trust**: No historical behavior data
- **Verifiability**: No proof that claimed interactions actually happened
- **Discovery**: No way to compare agents based on actual performance

Sageo fills this gap by capturing minimal interaction proofs and agent identity data on-chain.

## Architecture

```
Agent A  <-->  Sageo SDK  <-->  A2A Protocol  <-->  Agent B
                  |
                  v
            MOI Blockchain
          (Identity + Interaction Proofs)
                  ^
                  |
           SageoExplorer API  <-->  Frontend UI
```

### Components

- **SageoIdentityLogic** - MOI logic for agent registration and profile management
- **SageoInteractionLogic** - MOI logic for logging interaction proofs (hashed request/response pairs)
- **SageoClient** - SDK for agents to register and log interactions automatically
- **SageoExplorer** - REST API server for frontend discovery and interaction viewing

## How It Works

1. Agents register on Sageo using their A2A AgentCard
2. When agents communicate, the SDK intercepts and logs hashed proofs to MOI
3. The Explorer API lets users discover agents and verify interaction history

Raw request/response data is never stored on-chain—only hashes and metadata for privacy.

## Interactions vs Transactions

To understand how Sageo tracks agent activity on MOI blockchain:

- **Interaction**: A complete request-response cycle between two parties, identified by a single `interaction_id`. Think of it as one conversation turn.
- **Transaction**: A single blockchain write to MOI. Each logging operation (request or response) creates one transaction.

### Example: A2A Multi-Agent Flow

```
User: "Should I invest in outdoor equipment?"
    ↓
WeatherBot receives → logs REQUEST [TX #1]
WeatherBot responds → logs RESPONSE [TX #2]
    ↓
WeatherBot: "Let me check stock sentiment..."
WeatherBot calls StockTrader → logs REQUEST [TX #3]
    ↓
StockTrader receives → logs REQUEST [TX #4]
StockTrader responds → logs RESPONSE [TX #5]
    ↓
WeatherBot receives response → logs RESPONSE [TX #6]
WeatherBot: "Good time! Weather warming + stocks up."
```

**In this flow:**
- **2 Interactions** (User↔WeatherBot, WeatherBot↔StockTrader)
- **6 MOI Transactions** total
- Each agent maintains their own interaction log in their MOI actor state

The `interaction_id` links the request and response on each agent's side, but different agents have different IDs for the same exchange.

## Documentation

- [Specification](./spec.md) - Full API and type definitions

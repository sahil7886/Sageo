import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ClientFactory } from '@a2a-js/sdk/client';
import {
  AGENT_CARD_PATH,
  type AgentCard,
  type Message,
  type Task,
  type MessageSendParams,
} from '@a2a-js/sdk';
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  type AgentExecutor,
  type RequestContext,
  type ExecutionEventBus,
} from '@a2a-js/sdk/server';
import {
  agentCardHandler,
  jsonRpcHandler,
  restHandler,
  UserBuilder,
} from '@a2a-js/sdk/server/express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Server } from 'http';
import { SageoClient } from '../sdk/src/sageo-client.ts';
import { SageoRequestHandler } from '../sdk/src/request-handler.ts';
import { SAGEO_EXTENSION_URI } from '../sdk/src/config.ts';
import type { InteractionTxEvent } from '../sdk/src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENT_MNEMONICS_PATH = path.resolve(
  __dirname,
  '../backend/scripts/agent_mnemonics.json'
);
const RPC_URL = process.env.MOI_RPC_URL || 'https://voyage-rpc.moi.technology';
const AGENT1_PORT = Number(process.env.AGENT1_PORT || 4101);
const AGENT2_PORT = Number(process.env.AGENT2_PORT || 4102);
const AGENT1_SAGEO_ID = process.env.AGENT1_SAGEO_ID || 'agent_1';
const AGENT2_SAGEO_ID = process.env.AGENT2_SAGEO_ID || 'agent_2';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const USER_MESSAGE =
  process.env.USER_MESSAGE ||
  'Plan a trip to Tokyo and ask StockTrader for NVDA sentiment.';
const CHAIN_INTENT = 'outdoor_investment';
const END_USER_ID = process.env.END_USER_ID || '';
const END_USER_SESSION_ID = process.env.END_USER_SESSION_ID || '';
const RUN_DEMO = process.env.RUN_DEMO === 'true' || process.argv.includes('--demo');

type StoredAgent = {
  name: string;
  sageo_id: string;
  mnemonic: string;
  wallet_address: string;
};

function loadAgentById(agentId: string): StoredAgent {
  if (!fs.existsSync(AGENT_MNEMONICS_PATH)) {
    throw new Error(`Missing agent mnemonics at ${AGENT_MNEMONICS_PATH}`);
  }

  const data = JSON.parse(fs.readFileSync(AGENT_MNEMONICS_PATH, 'utf-8'));
  const agents = Array.isArray(data?.agents) ? (data.agents as StoredAgent[]) : [];
  const agent = [...agents].reverse().find((entry) => entry.sageo_id === agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found in agent_mnemonics.json`);
  }
  return agent;
}

function buildPlaceholderCard(name: string): AgentCard {
  return {
    name,
    description: `${name} placeholder card for SDK initialization.`,
    protocolVersion: '0.3.0',
    version: '0.0.0',
    url: 'http://localhost',
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    skills: [
      {
        id: 'placeholder',
        name: 'Placeholder',
        description: 'Placeholder skill for SDK initialization.',
        tags: ['placeholder'],
        examples: ['hello'],
        inputModes: ['text'],
        outputModes: ['text'],
      },
    ],
  };
}

function withLocalEndpoints(card: AgentCard, port: number): AgentCard {
  const baseUrl = `http://localhost:${port}`;
  const jsonRpcUrl = `${baseUrl}/a2a/jsonrpc`;
  const restUrl = `${baseUrl}/a2a/rest`;

  return {
    ...card,
    preferredTransport: 'JSONRPC',
    url: jsonRpcUrl,
    additionalInterfaces: [
      { url: jsonRpcUrl, transport: 'JSONRPC' },
      { url: restUrl, transport: 'HTTP+JSON' },
    ],
  };
}

function extractFirstText(message: Message): string {
  const parts = message.parts || [];
  for (const part of parts) {
    if (part.kind === 'text' && 'text' in part) {
      return String((part as any).text || '');
    }
  }
  return '';
}

function formatResponse(result: Message | Task): string {
  if (result.kind === 'task') {
    const task = result as Task;
    return `Task ${task.id} (${task.status?.state || 'unknown'})`;
  }
  const message = result as Message;
  return extractFirstText(message) || '[empty response]';
}

function stripStockTraderPrefix(text: string): string {
  return text.replace(/^StockTrader analysis for\s+\"[^\"]*\"\s*:\s*/i, '').trim();
}

async function reportTxEvent(event: InteractionTxEvent): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/interactions/tx-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.warn('Failed to report tx event to backend:', error);
  }
}

async function ensureInteractionEnrollment(
  sageoClient: SageoClient,
  sageoId: string
): Promise<void> {
  try {
    const walletIdentifier = await sageoClient.interaction.getWalletIdentifier();
    const stats = await sageoClient.interaction.getAgentStats(walletIdentifier);
    if (stats.found) {
      return;
    }
    console.log(`🧩 Enlisting ${sageoId} on interaction contract...`);
    await sageoClient.interaction.enlist(sageoId);
    console.log(`✅ Enlisted ${sageoId}`);
  } catch (error) {
    console.warn(`⚠️ Failed to ensure enlistment for ${sageoId}:`, error);
  }
}

async function startAgentServer(
  label: string,
  agentCard: AgentCard,
  executor: AgentExecutor,
  sageoClient: SageoClient,
  port: number
): Promise<Server> {
  const baseHandler = new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    executor
  );
  const sageoHandler = new SageoRequestHandler(baseHandler, sageoClient);

  const app = express();
  app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: sageoHandler }));
  app.use(
    '/a2a/jsonrpc',
    jsonRpcHandler({ requestHandler: sageoHandler, userBuilder: UserBuilder.noAuthentication })
  );
  app.use(
    '/a2a/rest',
    restHandler({ requestHandler: sageoHandler, userBuilder: UserBuilder.noAuthentication })
  );

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`✅ ${label} server listening at http://localhost:${port}`);
      resolve(server);
    });
  });
}

class StockTraderExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const question = extractFirstText(requestContext.userMessage) || 'No question provided.';
    const response: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [
        {
          kind: 'text',
          text: 'Outdoor gear demand typically rises with mild spring/summer forecasts; sector outlook neutral.',
        },
      ],
      contextId: requestContext.contextId,
    };

    eventBus.publish(response);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => { };
}

class WeatherBotExecutor implements AgentExecutor {
  private agent2Client: { sendMessage: (params: MessageSendParams) => Promise<Message | Task> };

  constructor(agent2Client: { sendMessage: (params: MessageSendParams) => Promise<Message | Task> }) {
    this.agent2Client = agent2Client;
  }

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userQuestion = extractFirstText(requestContext.userMessage) || 'No question provided.';
    const upstreamTrace = requestContext.userMessage.metadata?.[SAGEO_EXTENSION_URI];
    const forwardedExtensions = Array.isArray(requestContext.userMessage.extensions)
      ? [...requestContext.userMessage.extensions]
      : [];
    if (upstreamTrace && !forwardedExtensions.includes(SAGEO_EXTENSION_URI)) {
      forwardedExtensions.push(SAGEO_EXTENSION_URI);
    }

    const agent2Params: MessageSendParams = {
      message: {
        kind: 'message',
        messageId: uuidv4(),
        role: 'user',
        parts: [
          {
            kind: 'text',
            text: `User asked: "${userQuestion}". Provide stock context.`,
          },
        ],
        contextId: requestContext.contextId,
        metadata: upstreamTrace
          ? {
            [SAGEO_EXTENSION_URI]: upstreamTrace,
          }
          : undefined,
        extensions: forwardedExtensions.length > 0 ? forwardedExtensions : undefined,
      },
    };

    console.log('➡️ WeatherBot calling StockTrader via SageoClient wrapper...');
    const agent2Response = await this.agent2Client.sendMessage(agent2Params);
    const stockSummary = formatResponse(agent2Response);
    const cleanedStockSummary = stripStockTraderPrefix(stockSummary);

    const response: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [
        {
          kind: 'text',
          text: cleanedStockSummary
            ? `The next 10-day forecast is mostly mild and dry with a brief shower midweek, which should support outdoor activity and near-term equipment demand. Stock context: ${cleanedStockSummary}`
            : 'The next 10-day forecast is mostly mild and dry with a brief shower midweek, which should support outdoor activity and near-term equipment demand.',
        },
      ],
      contextId: requestContext.contextId,
    };

    eventBus.publish(response);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => { };
}

async function main() {
  console.log('========================================');
  console.log('Sageo A2A Multi-Agent Flow');
  console.log('========================================');

  const agent1Data = loadAgentById(AGENT1_SAGEO_ID);
  const agent2Data = loadAgentById(AGENT2_SAGEO_ID);

  const sageoClient1 = new SageoClient(
    RPC_URL,
    agent1Data.mnemonic,
    buildPlaceholderCard(agent1Data.name),
    undefined,
    undefined,
    {
      defaultEndUserId: END_USER_ID || undefined,
      defaultEndUserSessionId: END_USER_SESSION_ID || undefined,
      onInteractionTxEvent: reportTxEvent,
    }
  );
  const sageoClient2 = new SageoClient(
    RPC_URL,
    agent2Data.mnemonic,
    buildPlaceholderCard(agent2Data.name),
    undefined,
    undefined,
    {
      defaultEndUserId: END_USER_ID || undefined,
      defaultEndUserSessionId: END_USER_SESSION_ID || undefined,
      onInteractionTxEvent: reportTxEvent,
    }
  );

  console.log('🔧 Initializing Sageo clients...');
  await sageoClient1.initialize();
  await sageoClient2.initialize();

  const agent1Profile = await sageoClient1.getMyProfile();
  const agent2Profile = await sageoClient2.getMyProfile();
  await ensureInteractionEnrollment(sageoClient1, agent1Profile.sageo_id);
  await ensureInteractionEnrollment(sageoClient2, agent2Profile.sageo_id);

  const agent1CardOnChain = agent1Profile.agent_card;
  const agent2CardOnChain = agent2Profile.agent_card;

  const agent1CardLocal = withLocalEndpoints(agent1CardOnChain, AGENT1_PORT);
  const agent2CardLocal = withLocalEndpoints(agent2CardOnChain, AGENT2_PORT);

  console.log(`✅ Loaded Sageo IDs: ${agent1Profile.sageo_id}, ${agent2Profile.sageo_id}`);

  const stockExecutor = new StockTraderExecutor();
  const stockServer = await startAgentServer(
    'StockTrader',
    agent2CardLocal,
    stockExecutor,
    sageoClient2,
    AGENT2_PORT
  );

  const clientFactory = new ClientFactory();
  const agent2A2AClientRaw = await clientFactory.createFromUrl(
    `http://localhost:${AGENT2_PORT}`
  );
  const agent2A2AClient = {
    sendMessage: async (params: MessageSendParams) =>
      agent2A2AClientRaw.sendMessage(params),
    getTask: async (taskId: string) =>
      agent2A2AClientRaw.getTask({ taskId }),
  };
  const wrappedAgent2Client = sageoClient1.wrapA2AClient(
    agent2A2AClient,
    agent2CardOnChain,
    agent2Profile.sageo_id
  );

  const weatherExecutor = new WeatherBotExecutor(wrappedAgent2Client);
  const weatherServer = await startAgentServer(
    'WeatherBot',
    agent1CardLocal,
    weatherExecutor,
    sageoClient1,
    AGENT1_PORT
  );

  // If RUN_DEMO mode, run the full automated demo flow
  if (RUN_DEMO) {
    console.log('\n👤 End user sending message to WeatherBot...');
    const userClient = await clientFactory.createFromUrl(
      `http://localhost:${AGENT1_PORT}`
    );
    const contextId = uuidv4();
    const messageId = uuidv4();
    const interactionId = `ix_chain_${contextId}`;
    const traceMetadata: Record<string, unknown> = {
      conversation_id: contextId,
      interaction_id: interactionId,
      caller_sageo_id: END_USER_ID ? `external_${END_USER_ID}` : `external_${contextId}`,
      callee_sageo_id: agent1Profile.sageo_id,
      a2a: {
        contextId,
        taskId: '',
        messageId,
        method: 'message/send',
      },
      intent: CHAIN_INTENT,
      a2a_client_timestamp_ms: Date.now(),
    };
    if (END_USER_ID) {
      traceMetadata.end_user = {
        id: END_USER_ID,
        session_id: END_USER_SESSION_ID || undefined,
      };
    }
    const userParams: MessageSendParams = {
      message: {
        kind: 'message',
        messageId,
        role: 'user',
        parts: [{ kind: 'text', text: USER_MESSAGE }],
        contextId,
        metadata: {
          [SAGEO_EXTENSION_URI]: traceMetadata,
        },
        extensions: [SAGEO_EXTENSION_URI],
      },
    };

    const response = await userClient.sendMessage(userParams);
    console.log('✅ End user received response:');
    console.log(formatResponse(response));

    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    console.log('\n🔎 Fetching latest interactions...');
    const [agent1Interactions, agent2Interactions] = await Promise.all([
      fetch(`${API_BASE_URL}/agents/${agent1Profile.sageo_id}/interactions?limit=2&offset=0`)
        .then((res) => res.json())
        .catch(() => ({ interactions: [] })),
      fetch(`${API_BASE_URL}/agents/${agent2Profile.sageo_id}/interactions?limit=1&offset=0`)
        .then((res) => res.json())
        .catch(() => ({ interactions: [] })),
    ]);

    const agent1Latest = Array.isArray(agent1Interactions?.interactions)
      ? agent1Interactions.interactions
      : [];
    const agent2Latest = Array.isArray(agent2Interactions?.interactions)
      ? agent2Interactions.interactions
      : [];

    console.log('\nLatest agent_1 interactions:');
    console.log(JSON.stringify(agent1Latest, null, 2));
    console.log('\nLatest agent_2 interactions:');
    console.log(JSON.stringify(agent2Latest, null, 2));

    console.log('\n🧹 Shutting down servers...');
    await Promise.all([
      new Promise<void>((resolve) => weatherServer.close(() => resolve())),
      new Promise<void>((resolve) => stockServer.close(() => resolve())),
    ]);
    return;
  }

  // Default behavior: keep servers running and wait for external requests
  console.log('\n✅ Servers running and waiting for requests');
  console.log('   WeatherBot: http://localhost:' + AGENT1_PORT);
  console.log('   StockTrader: http://localhost:' + AGENT2_PORT);
  console.log('   Use --demo flag or RUN_DEMO=true to run automated demo flow');
  console.log('   Press Ctrl+C to stop');

  // Keep process alive
  await new Promise(() => { });
}

main().catch((error) => {
  console.error('❌ Flow failed:', error);
  process.exit(1);
});

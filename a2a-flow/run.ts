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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENT_MNEMONICS_PATH = path.resolve(
  __dirname,
  '../api/scripts/agent_mnemonics.json'
);
const RPC_URL = process.env.MOI_RPC_URL || 'https://voyage-rpc.moi.technology';
const AGENT1_PORT = Number(process.env.AGENT1_PORT || 4101);
const AGENT2_PORT = Number(process.env.AGENT2_PORT || 4102);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const USER_MESSAGE =
  process.env.USER_MESSAGE ||
  'Plan a trip to Tokyo and ask StockTrader for NVDA sentiment.';

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
  const agent = agents.find((entry) => entry.sageo_id === agentId);
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
          text: `StockTrader analysis for "${question}": NVDA looks stable; outlook neutral.`,
        },
      ],
      contextId: requestContext.contextId,
    };

    eventBus.publish(response);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
}

class WeatherBotExecutor implements AgentExecutor {
  private agent2Client: { sendMessage: (params: MessageSendParams) => Promise<Message | Task> };

  constructor(agent2Client: { sendMessage: (params: MessageSendParams) => Promise<Message | Task> }) {
    this.agent2Client = agent2Client;
  }

  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userQuestion = extractFirstText(requestContext.userMessage) || 'No question provided.';

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
      },
    };

    console.log('➡️ WeatherBot calling StockTrader via SageoClient wrapper...');
    const agent2Response = await this.agent2Client.sendMessage(agent2Params);
    const stockSummary = formatResponse(agent2Response);

    const response: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [
        {
          kind: 'text',
          text: `WeatherBot response for "${userQuestion}".\nStockTrader says: ${stockSummary}`,
        },
      ],
      contextId: requestContext.contextId,
    };

    eventBus.publish(response);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
}

async function main() {
  console.log('========================================');
  console.log('Sageo A2A Multi-Agent Flow');
  console.log('========================================');

  const agent1Data = loadAgentById('agent_1');
  const agent2Data = loadAgentById('agent_2');

  const sageoClient1 = new SageoClient(
    RPC_URL,
    agent1Data.mnemonic,
    buildPlaceholderCard(agent1Data.name)
  );
  const sageoClient2 = new SageoClient(
    RPC_URL,
    agent2Data.mnemonic,
    buildPlaceholderCard(agent2Data.name)
  );

  console.log('🔧 Initializing Sageo clients...');
  await sageoClient1.initialize();
  await sageoClient2.initialize();

  const agent1Profile = await sageoClient1.getMyProfile();
  const agent2Profile = await sageoClient2.getMyProfile();

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

  console.log('\n👤 End user sending message to WeatherBot...');
  const userClient = await clientFactory.createFromUrl(
    `http://localhost:${AGENT1_PORT}`
  );
  const contextId = uuidv4();
  const userParams: MessageSendParams = {
    message: {
      kind: 'message',
      messageId: uuidv4(),
      role: 'user',
      parts: [{ kind: 'text', text: USER_MESSAGE }],
      contextId,
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
}

main().catch((error) => {
  console.error('❌ Flow failed:', error);
  process.exit(1);
});

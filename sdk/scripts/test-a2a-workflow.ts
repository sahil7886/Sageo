#!/usr/bin/env tsx
/**
 * A2A Workflow E2E Test Script
 * Tests the complete A2A workflow with Sageo wrapping: register agents, send message, verify interaction logged to MOI
 */

import { SageoClient, SageoIdentitySDK } from '../src/index.js';
import {
  DEFAULT_IDENTITY_LOGIC_ID,
  DEFAULT_INTERACTION_LOGIC_ID,
  DEFAULT_RPC_URL,
  loadManifest,
} from '../src/config.js';
import type { AgentCard, SendMessageRequest, InteractionRecord } from '../src/index.js';
import { hashPayload, extractSageoMetadata, SAGEO_EXTENSION_URI } from '../src/utils.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Contract addresses (from deployment)
const IDENTITY_LOGIC_ID = DEFAULT_IDENTITY_LOGIC_ID;
const INTERACTION_LOGIC_ID = DEFAULT_INTERACTION_LOGIC_ID;

// MOI RPC URL for devnet
const MOI_RPC_URL = DEFAULT_RPC_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_MNEMONICS_PATH = path.resolve(__dirname, '../../api/scripts/agent_mnemonics.json');
const CALLER_SAGEO_ID = 'agent_2'; // StockTrader
const CALLEE_SAGEO_ID = 'agent_1'; // WeatherBot

// Helper to generate unique IDs
function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to extract interaction ID from response metadata
function extractInteractionId(response: any): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  // Try to get from message metadata
  if (response.kind === 'message' && response.metadata) {
    const sageoMetadata = response.metadata[SAGEO_EXTENSION_URI];
    if (sageoMetadata && sageoMetadata.interaction_id) {
      return sageoMetadata.interaction_id;
    }
  }

  // Try to get from task metadata
  if (response.kind === 'task' && response.metadata) {
    const sageoMetadata = response.metadata[SAGEO_EXTENSION_URI];
    if (sageoMetadata && sageoMetadata.interaction_id) {
      return sageoMetadata.interaction_id;
    }
  }

  return null;
}

async function listInteractionsWithFallback(
  client: SageoClient,
  identifiers: string[],
  options: { limit: bigint; offset: bigint; interactionId?: string; retries?: number; delayMs?: number }
): Promise<{ result: Awaited<ReturnType<SageoClient['interaction']['listInteractionsByAgent']>>; identifier: string; found: boolean }> {
  const retries = options.retries ?? 3;
  const delayMs = options.delayMs ?? 2000;
  let lastResult: Awaited<ReturnType<SageoClient['interaction']['listInteractionsByAgent']>> | null = null;
  let lastIdentifier = identifiers[0] ?? '';

  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const identifier of identifiers) {
      try {
        const result = await client.interaction.listInteractionsByAgent({
          agentIdentifier: identifier,
          limit: options.limit,
          offset: options.offset,
        });
        lastResult = result;
        lastIdentifier = identifier;
        if (options.interactionId) {
          if (result.records.some((r) => r.interaction_id === options.interactionId)) {
            return { result, identifier, found: true };
          }
        } else if (result.records.length || result.total > 0n) {
          return { result, identifier, found: false };
        }
      } catch (error) {
        // Skip identifiers that aren't valid for this query (e.g., non-hex sageo_id)
        const message = String(error);
        if (
          message.includes('Invalid hex string') ||
          message.includes('Failed to list interactions')
        ) {
          continue;
        }
        throw error;
      }
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { result: lastResult ?? { records: [], total: 0n }, identifier: lastIdentifier, found: false };
}

async function findInteractionByRequestHash(
  client: SageoClient,
  agentIdentifier: string,
  requestHash: string,
  options: { limit: bigint; retries?: number; delayMs?: number }
): Promise<InteractionRecord | null> {
  const retries = options.retries ?? 4;
  const delayMs = options.delayMs ?? 2000;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let listResult = await client.interaction.listInteractionsByAgent({
      agentIdentifier,
      limit: options.limit,
      offset: 0n,
    });
    let match = listResult.records.find((r) => r.request_hash === requestHash);
    if (!match) {
      try {
        listResult = await client.interaction.listInteractionsByAgentFromState({
          agentIdentifier,
          limit: options.limit,
          offset: 0n,
        });
        match = listResult.records.find((r) => r.request_hash === requestHash);
      } catch {
        // ignore state fallback errors
      }
    }
    if (match) {
      return match;
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

async function testA2AWorkflow() {
  console.log('========================================');
  console.log('A2A Workflow E2E Test');
  console.log('========================================\n');

  let callerClient: SageoClient;
  let callerSageoId: string;
  let calleeSageoId: string;
  let calleeAgentCard: AgentCard;
  let initialInteractions = 0;
  let newInteractionCount = 0;
  let callerWalletAddress = '';
  let listIdentifier = '';

  try {
    const agentMnemonicsRaw = await fs.readFile(AGENT_MNEMONICS_PATH, 'utf8');
    const agentMnemonics = JSON.parse(agentMnemonicsRaw) as {
      agents?: Array<{
        name?: string;
        sageo_id?: string;
        mnemonic?: string;
        wallet_address?: string;
      }>;
    };
    const agents = agentMnemonics.agents ?? [];
    if (agents.length < 2) {
      throw new Error(`Need at least two agents in ${AGENT_MNEMONICS_PATH}`);
    }
    const callerAgentRecord =
      agents.find((agent) => agent.sageo_id === CALLER_SAGEO_ID) ?? agents[1];
    const calleeAgentRecord =
      agents.find((agent) => agent.sageo_id === CALLEE_SAGEO_ID) ?? agents[0];

    if (!callerAgentRecord?.mnemonic || !calleeAgentRecord?.mnemonic) {
      throw new Error(`Missing mnemonic(s) in ${AGENT_MNEMONICS_PATH}`);
    }

    callerSageoId = callerAgentRecord.sageo_id ?? CALLER_SAGEO_ID;
    calleeSageoId = calleeAgentRecord.sageo_id ?? CALLEE_SAGEO_ID;
    const callerMnemonic = callerAgentRecord.mnemonic;

    // Step 1: Query callee agent on MOI and initialize caller client
    console.log('1. Querying existing agents on MOI...');
    
    // Initialize Identity SDK for read operations
    const identityManifest = loadManifest('identity');
    const identitySDK = await SageoIdentitySDK.init({
      logicId: IDENTITY_LOGIC_ID,
      manifest: identityManifest,
      rpcUrl: MOI_RPC_URL,
      privateKey: callerMnemonic,
    });
    
    // Query callee (WeatherBot)
    console.log(`   Querying callee ${calleeSageoId}...`);
    const weatherFullProfile = await identitySDK.getAgentProfile(calleeSageoId);
    if (!weatherFullProfile.found || !weatherFullProfile.profile) {
      throw new Error(`Failed to fetch callee profile for ${calleeSageoId}`);
    }
    calleeAgentCard = weatherFullProfile.profile.agent_card;
    console.log(`   ✅ Found callee: ${calleeSageoId} (${calleeAgentCard.name})\n`);

    // Query caller profile if it already exists
    const callerFullProfile = await identitySDK.getAgentProfile(callerSageoId);
    
    // Caller agent card (uses funded mnemonic; this agent will be registered if not found)
    const callerAgentCard: AgentCard =
      callerFullProfile.found && callerFullProfile.profile?.agent_card
        ? callerFullProfile.profile.agent_card
        : {
            name: 'TestCaller',
            description: 'Test caller agent for A2A workflow',
            version: '1.0.0',
            url: 'https://test-caller.example.com',
            protocolVersion: '0.3.0',
            defaultInputModes: ['text'],
            defaultOutputModes: ['text'],
            capabilities: {
              streaming: false,
              pushNotifications: false,
              stateTransitionHistory: false,
            },
            skills: [],
          };
    
    // Initialize caller client
    callerClient = new SageoClient(
      MOI_RPC_URL,
      callerMnemonic,
      callerAgentCard,
      IDENTITY_LOGIC_ID,
      INTERACTION_LOGIC_ID
    );
    console.log('   ✅ SageoClients initialized\n');

    // Step 2: Ensure caller is registered
    console.log('2. Ensuring caller agent is registered...');
    try {
      const callerProfile = await callerClient.getMyProfile();
      callerSageoId = callerProfile.sageo_id;
      callerWalletAddress = callerProfile.wallet_address;
      console.log(`   ✅ Caller agent registered: ${callerSageoId}`);
    } catch (error) {
      console.error('   ❌ Failed to register caller agent:', error);
      throw error;
    }
    console.log(`   ✅ Callee agent (WeatherBot) already registered: ${calleeSageoId}\n`);

    // Initialize caller client explicitly before wrapping
    // Ensure wallet identifiers match what we will use for lookups
    const signerIdentifier = await callerClient.interaction.getWalletIdentifier();
    if (!callerWalletAddress) {
      callerWalletAddress = signerIdentifier;
    }
    console.log(`   Caller wallet (profile): ${callerWalletAddress}`);
    console.log(`   Caller wallet (signer):  ${signerIdentifier}`);

    // Ensure caller is enlisted in InteractionLogic
    console.log('   Enlisting caller in InteractionLogic...');
    try {
      await callerClient.interaction.enlist(callerSageoId);
      console.log('   ✅ Caller enlisted in InteractionLogic\n');
    } catch (error) {
      const msg = String(error);
      if (msg.includes('already')) {
        console.log('   ✅ Caller already enlisted in InteractionLogic\n');
      } else {
        console.warn('   ⚠️  Failed to enlist in InteractionLogic:', msg);
      }
    }

    // Step 3: Get initial interaction count
    console.log('3. Getting initial interaction count...');
    try {
      const listResult = await listInteractionsWithFallback(
        callerClient,
        [callerWalletAddress],
        { limit: 100n, offset: 0n, retries: 1, delayMs: 1000 }
      );
      listIdentifier = listResult.identifier;
      initialInteractions = Number(listResult.result.total);
      console.log(`   ✅ Initial interaction count: ${initialInteractions}\n`);
    } catch (error) {
      console.warn('   ⚠️  Could not get initial interaction count, assuming 0');
      initialInteractions = 0;
    }

    // Step 4: Create mock A2A client (simulates WeatherBot response)
    console.log('4. Creating mock A2A client...');
    const mockA2AClient = {
      sendMessage: async (request: SendMessageRequest) => {
        console.log('   (Mock A2A) Received request, generating response...');
        // Return realistic A2A response from WeatherBot
        return {
          kind: 'message' as const,
          messageId: generateId('msg_'),
          role: 'agent' as const,
          parts: [
            {
              kind: 'text' as const,
              text: 'The weather in Paris tomorrow will be partly cloudy with a high of 18°C (64°F) and a low of 12°C (54°F). There is a 20% chance of light rain in the afternoon.',
            },
          ],
          contextId: request.params.message.contextId || generateId('ctx_'),
          taskId: request.params.message.taskId || generateId('task_'),
          metadata: request.params.message.metadata || {},
          extensions: request.params.message.extensions || [],
        };
      },
      getTask: async (taskId: string) => {
        return {
          kind: 'task' as const,
          id: taskId,
          contextId: generateId('ctx_'),
          status: 'completed' as const,
        };
      },
    };
    console.log('   ✅ Mock A2A client created\n');

    // Step 5: Wrap caller's A2A client
    console.log('5. Wrapping caller A2A client with Sageo...');
    const wrappedClient = callerClient.wrapA2AClient(
      mockA2AClient as any,
      calleeAgentCard,
      calleeSageoId
    );
    console.log('   ✅ A2A client wrapped\n');

    // Step 6: Create and send A2A message
    console.log('6. Sending A2A message...');
    const contextId = generateId('ctx_');
    const taskId = generateId('task_');
    const messageId = generateId('msg_');

    const request: SendMessageRequest = {
      id: 1,
      jsonrpc: '2.0',
      method: 'message/send',
      params: {
        message: {
          kind: 'message',
          messageId,
          role: 'user',
          parts: [
            {
              kind: 'text',
              text: 'What is the weather forecast for Paris tomorrow?',
            },
          ],
          contextId,
          taskId,
          metadata: {},
          extensions: [],
        },
      },
    };

    const requestHash = hashPayload(request);
    console.log(`   Request hash: ${requestHash.substring(0, 16)}...`);

    const response = await wrappedClient.sendMessage(request);
    const responseHash = hashPayload(response);
    console.log(`   Response hash: ${responseHash.substring(0, 16)}...`);
    console.log('   ✅ A2A message sent and response received\n');

    // Step 7: Extract interaction ID from response
    console.log('7. Extracting interaction ID...');
    const extractedInteractionId = extractInteractionId(response);
    if (!extractedInteractionId) {
      throw new Error('No interaction_id found in response metadata');
    }
    let interactionId = extractedInteractionId;
    console.log(`   ✅ Interaction ID: ${interactionId}\n`);

    // Step 8: Verify interaction logged to MOI
    console.log('8. Verifying interaction logged to MOI...');
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for blockchain confirmation

    // GetInteraction requires wallet address, not sageo_id.
    // Use the interaction SDK's wallet identifier to ensure it's the same signer that logged the interaction.
    // Reuse the caller wallet address captured earlier
    
    // Verify the interaction is actually on-chain
    console.log(`   Checking on-chain state for interaction ${interactionId}...`);
    let interactionResult = await callerClient.interaction.getInteraction(
      callerWalletAddress,
      interactionId
    );

    // Retry a few times in case of eventual consistency
    if (!interactionResult.found) {
      for (let attempt = 1; attempt <= 4; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        interactionResult = await callerClient.interaction.getInteraction(
          callerWalletAddress,
          interactionId
        );
        if (interactionResult.found) {
          break;
        }
      }
    }

    if (!interactionResult.found) {
      // Fallback: list interactions and try to match by request hash
      const listResult = await callerClient.interaction.listInteractionsByAgent({
        agentIdentifier: callerWalletAddress,
        limit: 20n,
        offset: 0n,
      });
      const match = listResult.records.find((r) => r.request_hash === requestHash);
      if (match) {
        interactionId = match.interaction_id;
        interactionResult = { record: match, found: true };
      } else {
        const knownIds = listResult.records.map((r) => r.interaction_id).join(', ');
        throw new Error(
          `Interaction ${interactionId} not found on MOI for ${callerWalletAddress}. ` +
          `Recent interactions: ${knownIds || 'none'}`
        );
      }
    }

    let interaction = interactionResult.record;
    console.log('   ✅ Interaction found on MOI (verified on-chain)');

    const now = BigInt(Math.floor(Date.now() / 1000));
    const looksStale =
      interaction.request_hash !== requestHash ||
      interaction.callee_sageo_id !== calleeSageoId ||
      interaction.a2a_context_id !== contextId ||
      interaction.a2a_task_id !== taskId ||
      interaction.a2a_message_id !== messageId ||
      now - interaction.timestamp > 120n;

    if (looksStale) {
      const match = await findInteractionByRequestHash(
        callerClient,
        callerWalletAddress,
        requestHash,
        { limit: 200n, retries: 5, delayMs: 2000 }
      );
      if (match) {
        interaction = match;
        interactionId = match.interaction_id;
        console.log(`   ✅ Found current interaction by request hash: ${interactionId}`);
      }
    }

    // Step 9: Verify metadata matches
    console.log('9. Verifying interaction metadata...');
    const errors: string[] = [];

    if (interaction.interaction_id !== interactionId) {
      errors.push(`Interaction ID mismatch: expected ${interactionId}, got ${interaction.interaction_id}`);
    }

    if (interaction.caller_sageo_id !== callerSageoId) {
      errors.push(`Caller ID mismatch: expected ${callerSageoId}, got ${interaction.caller_sageo_id}`);
    }

    if (interaction.callee_sageo_id !== calleeSageoId) {
      errors.push(`Callee ID mismatch: expected ${calleeSageoId}, got ${interaction.callee_sageo_id}`);
    }

    if (interaction.request_hash !== requestHash) {
      errors.push(`Request hash mismatch: expected ${requestHash.substring(0, 16)}..., got ${interaction.request_hash.substring(0, 16)}...`);
    }

    if (interaction.response_hash !== responseHash) {
      errors.push(`Response hash mismatch: expected ${responseHash.substring(0, 16)}..., got ${interaction.response_hash.substring(0, 16)}...`);
    }

    const timeDiff = now - interaction.timestamp;
    if (timeDiff < 0n || timeDiff > 120n) {
      // Allow up to 2 minutes difference
      errors.push(`Timestamp out of range: ${interaction.timestamp}, expected within last 120 seconds`);
    }

    if (interaction.a2a_context_id !== contextId) {
      errors.push(`A2A context ID mismatch: expected ${contextId}, got ${interaction.a2a_context_id}`);
    }

    if (interaction.a2a_task_id !== taskId) {
      errors.push(`A2A task ID mismatch: expected ${taskId}, got ${interaction.a2a_task_id}`);
    }

    if (interaction.a2a_message_id !== messageId) {
      errors.push(`A2A message ID mismatch: expected ${messageId}, got ${interaction.a2a_message_id}`);
    }

    if (errors.length > 0) {
      console.error('   ❌ Verification failed:');
      errors.forEach((error) => console.error(`      - ${error}`));
      throw new Error('Metadata verification failed');
    }

    console.log('   ✅ All metadata verified:');
    console.log(`      - Interaction ID: ${interaction.interaction_id}`);
    console.log(`      - Caller Sageo ID: ${interaction.caller_sageo_id}`);
    console.log(`      - Callee Sageo ID: ${interaction.callee_sageo_id}`);
    console.log(`      - Request Hash: ${interaction.request_hash.substring(0, 16)}...`);
    console.log(`      - Response Hash: ${interaction.response_hash.substring(0, 16)}...`);
    console.log(`      - Timestamp: ${interaction.timestamp}`);
    console.log(`      - Status Code: ${interaction.status_code}`);
    console.log(`      - Intent: ${interaction.intent}\n`);

    // Step 10: Verify interaction appears in list
    console.log('10. Verifying interaction appears in list...');
    const identifiers = [listIdentifier || callerWalletAddress].filter(Boolean);
    let listResult = await listInteractionsWithFallback(
      callerClient,
      identifiers,
      { limit: 20n, offset: 0n, interactionId, retries: 4, delayMs: 2000 }
    );
    let interactionsResult = listResult.result;
    if (!interactionsResult.records.length) {
      try {
        interactionsResult = await callerClient.interaction.listInteractionsByAgentFromState({
          agentIdentifier: callerWalletAddress,
          limit: 50n,
          offset: 0n,
        });
      } catch {
        // ignore state fallback errors
      }
    }

    const foundInList = interactionsResult.records.some(
      (r) => r.interaction_id === interactionId
    );

    if (!foundInList) {
      const knownIds = interactionsResult.records.map((r) => r.interaction_id).join(', ');
      throw new Error(
        `Interaction ${interactionId} not found in list for ${listResult.identifier}. ` +
        `Recent interactions: ${knownIds || 'none'}`
      );
    }

    const newInteractionCount = Number(interactionsResult.total);
    if (newInteractionCount <= initialInteractions) {
      throw new Error(`Interaction count did not increase: ${initialInteractions} -> ${newInteractionCount}`);
    }

    console.log(`   ✅ Interaction found in list (on-chain verification)`);
    console.log(`   ✅ Interaction count increased: ${initialInteractions} -> ${newInteractionCount}`);
    
    // Additional verification: Check that the interaction has valid on-chain data
    const foundInteraction = interactionsResult.records.find(
      (r) => r.interaction_id === interactionId
    );
    if (foundInteraction) {
      console.log(`   ✅ On-chain verification:`);
      console.log(`      - Interaction ID: ${foundInteraction.interaction_id}`);
      console.log(`      - Stored on MOI at timestamp: ${foundInteraction.timestamp}`);
      console.log(`      - Request hash stored: ${foundInteraction.request_hash.substring(0, 16)}...`);
      console.log(`      - Response hash stored: ${foundInteraction.response_hash.substring(0, 16)}...`);
    }
    console.log('');

    // Summary
    console.log('========================================');
    console.log('✅ A2A Workflow E2E Test Passed!');
    console.log('========================================');
    console.log('\nSummary:');
    console.log(`  - Caller Agent: ${callerSageoId}`);
    console.log(`  - Callee Agent: ${calleeSageoId}`);
    console.log(`  - Interaction ID: ${interactionId}`);
    console.log(`  - Request Hash: ${requestHash.substring(0, 16)}...`);
    console.log(`  - Response Hash: ${responseHash.substring(0, 16)}...`);
    console.log(`  - Total Interactions: ${newInteractionCount}\n`);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ A2A Workflow E2E Test Failed');
    console.error('========================================\n');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    throw error;
  }
}

// Run test
testA2AWorkflow()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

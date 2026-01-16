#!/usr/bin/env tsx
/**
 * A2A Workflow E2E Test Script
 * Tests the complete A2A workflow with Sageo wrapping: register agents, send message, verify interaction logged to MOI
 */

import { SageoClient } from '../src/index.js';
import {
  DEFAULT_IDENTITY_LOGIC_ID,
  DEFAULT_INTERACTION_LOGIC_ID,
  DEFAULT_RPC_URL,
} from '../src/config.js';
import type { AgentCard, SendMessageRequest } from '../src/index.js';
import { hashPayload, extractSageoMetadata, SAGEO_EXTENSION_URI } from '../src/utils.js';

// Contract addresses (from deployment)
const IDENTITY_LOGIC_ID = DEFAULT_IDENTITY_LOGIC_ID;
const INTERACTION_LOGIC_ID = DEFAULT_INTERACTION_LOGIC_ID;

// MOI RPC URL for devnet
const MOI_RPC_URL = DEFAULT_RPC_URL;

// Caller agent mnemonic (Travel Agent)
const CALLER_MNEMONIC = 'repair cycle monitor satisfy warfare forest decorate reveal update economy pizza lift';

// Callee agent mnemonic (Hotel Agent) - Different from caller
const CALLEE_MNEMONIC = 'metal foil release inquiry slice deny cake blame sustain fault now sugar';

// Caller agent card (Travel Agent)
const CALLER_AGENT_CARD: AgentCard = {
  name: 'TravelAgent',
  description: 'A travel agent that helps users find hotels and plan trips',
  version: '1.0.0',
  url: 'https://travel-agent.example.com',
  protocolVersion: '0.3.0',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  skills: [
    {
      id: 'hotel_search',
      name: 'Hotel Search',
      description: 'Searches for hotel availability',
      tags: ['travel', 'hotels'],
      examples: ['Find hotels in Paris', 'Search for availability'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
  ],
  iconUrl: 'https://travel-agent.example.com/icon.png',
  documentationUrl: 'https://travel-agent.example.com/docs',
  preferredTransport: 'JSONRPC',
};

// Callee agent card (Hotel Agent)
const CALLEE_AGENT_CARD: AgentCard = {
  name: 'HotelAgent',
  description: 'A hotel booking agent that provides availability and pricing',
  version: '1.0.0',
  url: 'https://hotel-agent.example.com',
  protocolVersion: '0.3.0',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  skills: [
    {
      id: 'hotel_availability',
      name: 'Hotel Availability',
      description: 'Provides hotel availability and pricing',
      tags: ['hotels', 'booking'],
      examples: ['Check availability', 'Get hotel prices'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
  ],
  iconUrl: 'https://hotel-agent.example.com/icon.png',
  documentationUrl: 'https://hotel-agent.example.com/docs',
  preferredTransport: 'JSONRPC',
};

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

async function testA2AWorkflow() {
  console.log('========================================');
  console.log('A2A Workflow E2E Test');
  console.log('========================================\n');

  let callerClient: SageoClient;
  let calleeClient: SageoClient;
  let callerSageoId: string;
  let calleeSageoId: string;
  let initialInteractions = 0;
  let newInteractionCount = 0;

  try {
    // Step 1: Initialize both SageoClients
    console.log('1. Initializing SageoClients...');
    callerClient = new SageoClient(
      MOI_RPC_URL,
      CALLER_MNEMONIC,
      CALLER_AGENT_CARD,
      IDENTITY_LOGIC_ID,
      INTERACTION_LOGIC_ID
    );
    calleeClient = new SageoClient(
      MOI_RPC_URL,
      CALLEE_MNEMONIC,
      CALLEE_AGENT_CARD,
      IDENTITY_LOGIC_ID,
      INTERACTION_LOGIC_ID
    );
    console.log('   ✅ SageoClients created\n');

    // Step 2: Register and enlist both agents
    console.log('2. Registering and enlisting agents...');
    try {
      const callerProfile = await callerClient.getMyProfile();
      callerSageoId = callerProfile.sageo_id;
      console.log(`   ✅ Caller agent registered: ${callerSageoId}`);
    } catch (error) {
      console.error('   ❌ Failed to register caller agent:', error);
      throw error;
    }

    try {
      const calleeProfile = await calleeClient.getMyProfile();
      calleeSageoId = calleeProfile.sageo_id;
      console.log(`   ✅ Callee agent registered: ${calleeSageoId}\n`);
    } catch (error) {
      console.error('   ❌ Failed to register callee agent:', error);
      throw error;
    }

    // Step 3: Get initial interaction count
    console.log('3. Getting initial interaction count...');
    try {
      const interactions = await callerClient.interaction.listInteractionsByAgent({
        agentIdentifier: callerSageoId,
        limit: 100n,
        offset: 0n,
      });
      initialInteractions = Number(interactions.total);
      console.log(`   ✅ Initial interaction count: ${initialInteractions}\n`);
    } catch (error) {
      console.warn('   ⚠️  Could not get initial interaction count, assuming 0');
      initialInteractions = 0;
    }

    // Step 4: Create mock A2A client (simulates hotel agent response)
    console.log('4. Creating mock A2A client...');
    const mockA2AClient = {
      sendMessage: async (request: SendMessageRequest) => {
        console.log('   (Mock A2A) Received request, generating response...');
        // Return realistic A2A response
        return {
          kind: 'message' as const,
          messageId: generateId('msg_'),
          role: 'agent' as const,
          parts: [
            {
              kind: 'text' as const,
              text: 'We have 3 hotels available in Paris: Hotel A ($150/night), Hotel B ($200/night), Hotel C ($120/night)',
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
      CALLEE_AGENT_CARD
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
              text: 'Find hotels in Paris for 2 nights, check-in tomorrow',
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
    const interactionId = extractInteractionId(response);
    if (!interactionId) {
      throw new Error('No interaction_id found in response metadata');
    }
    console.log(`   ✅ Interaction ID: ${interactionId}\n`);

    // Step 8: Verify interaction logged to MOI
    console.log('8. Verifying interaction logged to MOI...');
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for blockchain confirmation

    // GetInteraction requires wallet address, not sageo_id
    const callerWalletAddress = await callerClient.resolveSageoIdToAddress(callerSageoId);
    
    // Verify the interaction is actually on-chain
    console.log(`   Checking on-chain state for interaction ${interactionId}...`);
    const interactionResult = await callerClient.interaction.getInteraction(
      callerWalletAddress,
      interactionId
    );

    if (!interactionResult.found) {
      throw new Error(`Interaction ${interactionId} not found on MOI - interaction was not logged to blockchain`);
    }

    const interaction = interactionResult.record;
    console.log('   ✅ Interaction found on MOI (verified on-chain)');

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

    const now = BigInt(Math.floor(Date.now() / 1000));
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
    const interactionsResult = await callerClient.interaction.listInteractionsByAgent({
      agentIdentifier: callerWalletAddress,
      limit: 10n,
      offset: 0n,
    });

    const foundInList = interactionsResult.records.some(
      (r) => r.interaction_id === interactionId
    );

    if (!foundInList) {
      throw new Error(`Interaction ${interactionId} not found in list`);
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

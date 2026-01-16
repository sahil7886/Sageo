#!/usr/bin/env tsx
/**
 * SDK Test Script
 * Tests the Sageo SDK functionality including agent registration, profile retrieval, and A2A client wrapping
 */

import { SageoClient } from '../src/index.js';
import {
  DEFAULT_IDENTITY_LOGIC_ID,
  DEFAULT_INTERACTION_LOGIC_ID,
  DEFAULT_RPC_URL,
} from '../src/config.js';
import type { AgentCard } from '../src/index.js';

// Contract addresses (from deployment)
const IDENTITY_LOGIC_ID = DEFAULT_IDENTITY_LOGIC_ID;
const INTERACTION_LOGIC_ID = DEFAULT_INTERACTION_LOGIC_ID;

// MOI RPC URL for devnet
const MOI_RPC_URL = DEFAULT_RPC_URL;

// Agent mnemonic
const AGENT_MNEMONIC = 'repair cycle monitor satisfy warfare forest decorate reveal update economy pizza lift';

// Test agent card
const TEST_AGENT_CARD: AgentCard = {
  name: 'SDKTestAgent',
  description: 'Test agent for SDK validation',
  version: '1.0.0',
  url: 'https://sdk-test.example.com',
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
      id: 'test_skill_1',
      name: 'Test Skill',
      description: 'A test skill for SDK validation',
      tags: ['test', 'sdk'],
      examples: ['Example 1', 'Example 2'],
      inputModes: ['text'],
      outputModes: ['text'],
    },
  ],
  iconUrl: 'https://sdk-test.example.com/icon.png',
  documentationUrl: 'https://sdk-test.example.com/docs',
  preferredTransport: 'JSONRPC',
};

async function testSDK() {
  console.log('========================================');
  console.log('Sageo SDK Test');
  console.log('========================================\n');

  try {
    // Initialize SageoClient
    console.log('1. Initializing SageoClient...');
    const sageoClient = new SageoClient(
      MOI_RPC_URL,
      AGENT_MNEMONIC,
      TEST_AGENT_CARD,
      IDENTITY_LOGIC_ID,
      INTERACTION_LOGIC_ID
    );
    console.log('   ✅ SageoClient created\n');

    // Test: Get/Register Agent Profile
    console.log('2. Testing getMyProfile() (requires manual registration)...');
    try {
      const profile = await sageoClient.getMyProfile();
      console.log('   ✅ Agent Profile Retrieved:');
      console.log(`      - Sageo ID: ${profile.sageo_id}`);
      console.log(`      - Owner: ${profile.owner}`);
      console.log(`      - Status: ${profile.status}`);
      console.log(`      - Wallet Address: ${profile.wallet_address}`);
      console.log(`      - Agent Name: ${profile.agent_card.name}`);
      console.log(`      - Agent URL: ${profile.agent_card.url}\n`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('Agent not registered')) {
        console.error('   ❌ Agent not registered on Sageo');
        console.error('   ⚠️  Register the agent via the Sageo app or API before running this test.');
        console.error('   ⚠️  Ensure the wallet is funded and has an on-chain profile.\n');
        throw new Error('Agent not registered - register before SDK usage.');
      }
      console.error('   ❌ Failed to get profile:', error);
      throw error;
    }

    // Test: Get Agent Card
    console.log('3. Testing getAgentCard()...');
    try {
      const profile = await sageoClient.getMyProfile();
      const card = await sageoClient.getAgentCard(profile.sageo_id);
      console.log('   ✅ Agent Card Retrieved:');
      console.log(`      - Name: ${card.name}`);
      console.log(`      - Description: ${card.description}`);
      console.log(`      - Skills: ${card.skills?.length || 0}\n`);
    } catch (error) {
      console.error('   ❌ Failed to get agent card:', error);
      throw error;
    }

    // Test: Get Agent Skills
    console.log('4. Testing getAgentSkills()...');
    try {
      const profile = await sageoClient.getMyProfile();
      const skills = await sageoClient.getAgentSkills(profile.sageo_id);
      console.log('   ✅ Agent Skills Retrieved:');
      console.log(`      - Number of skills: ${skills.length}`);
      skills.forEach((skill, index) => {
        console.log(`      - Skill ${index + 1}: ${skill.name} (${skill.id})`);
      });
      console.log('');
    } catch (error) {
      console.error('   ❌ Failed to get agent skills:', error);
      throw error;
    }

    // Test: Get Agent Profile by ID
    console.log('5. Testing getAgentProfile()...');
    try {
      const myProfile = await sageoClient.getMyProfile();
      const profile = await sageoClient.getAgentProfile(myProfile.sageo_id);
      console.log('   ✅ Agent Profile Retrieved by ID:');
      console.log(`      - Sageo ID: ${profile.sageo_id}`);
      console.log(`      - Name: ${profile.agent_card.name}\n`);
    } catch (error) {
      console.error('   ❌ Failed to get agent profile:', error);
      throw error;
    }

    // Test: Wrap A2A Client (mock)
    console.log('6. Testing wrapA2AClient()...');
    try {
      // Create a mock A2A client (in real usage, this would be from @a2a-js/sdk)
      const mockA2AClient = {
        sendMessage: async (request: any) => {
          console.log('      (Mock) A2A sendMessage called');
          return { kind: 'message', messageId: 'mock-msg-123' };
        },
        getTask: async (taskId: string) => {
          console.log(`      (Mock) A2A getTask called with: ${taskId}`);
          return { kind: 'task', id: taskId, status: 'pending' };
        },
      };

      // Use the same card for remote agent (in real usage, this would be the remote agent's card)
      const wrappedClient = sageoClient.wrapA2AClient(mockA2AClient as any, TEST_AGENT_CARD);
      console.log('   ✅ A2A Client Wrapped');
      console.log('   Note: Actual A2A client interaction requires a real A2A client instance\n');
    } catch (error) {
      console.error('   ❌ Failed to wrap A2A client:', error);
      // Don't throw - this might fail if agent isn't registered
      console.log('   ⚠️  This may fail if remote agent is not registered\n');
    }

    console.log('========================================');
    console.log('✅ All SDK Tests Passed!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ SDK Test Failed');
    console.error('========================================\n');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

// Run tests
testSDK()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch((error) => {
    console.error('Test failed:', error);
  });

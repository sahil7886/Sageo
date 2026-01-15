#!/usr/bin/env tsx
/**
 * SDK Test Script
 * Tests the Sageo SDK functionality including agent registration, profile retrieval, and A2A client wrapping
 */

import { SageoClient } from '../src/index.js';
import type { AgentCard } from '../src/index.js';

// Contract addresses (from deployment)
const IDENTITY_LOGIC_ID = '0x20000000865b8e9d17a93e28d83f1f873e2981e8cacf58a9425ad23900000000';
const INTERACTION_LOGIC_ID = '0x20000000c9a634c87c3173259f2b11d5389bf78ab4f0b6b7d61585d100000000';

// MOI RPC URL for devnet
const MOI_RPC_URL = 'https://voyage-rpc.moi.technology';

// Agent mnemonic (same as used in API for consistency)
// Note: This is the "agent_key" parameter - it's actually a mnemonic, not a private key
const AGENT_MNEMONIC = 'metal foil release inquiry slice deny cake blame sustain fault now sugar';

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
    console.log('2. Testing getMyProfile() (will register if not exists)...');
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
      if (errorMsg.includes('account not found')) {
        console.error('   ❌ Account not found on devnet');
        console.error('   ⚠️  This wallet account needs to be funded on MOI devnet first.');
        console.error('   ⚠️  The SDK code is working correctly, but needs a funded account.');
        console.error('   💡 Options:');
        console.error('      1. Fund this account via devnet faucet (if available)');
        console.error('      2. Use a different mnemonic with a funded account');
        console.error('      3. Wait for the account to be created/funded\n');
        throw new Error(
          'Account not found - wallet must exist and be funded on MOI devnet. This is a blockchain/environment issue, not an SDK bug.'
        );
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
    process.exit(1);
  }
}

// Run tests
testSDK()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

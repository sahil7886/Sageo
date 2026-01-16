#!/usr/bin/env tsx
/**
 * Script to create mock agents and interactions on the deployed Sageo contracts
 */

import {
  initializeMOI,
  getWallet,
  getLogicDriver,
  IDENTITY_LOGIC_ID,
  INTERACTION_LOGIC_ID,
  writeLogic,
  MOI_DERIVATION_PATH,
} from '../src/lib/moi-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled contract manifests
const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');

// Mock agents matching the updated contract structure
export const MOCK_AGENTS = [
  {
    name: "WeatherBot",
    description: "Provides weather updates and forecasts",
    version: "1.0.0",
    url: "https://weather.example.com",
    protocol_version: "0.3.0",
    default_input_modes: '["text","voice"]',
    default_output_modes: '["text"]',
    streaming: true,
    push_notifications: false,
    state_transition_history: false,
    icon_url: "https://weather.example.com/icon.png",
    documentation_url: "https://weather.example.com/docs",
    preferred_transport: "JSONRPC",
    skills: [
      {
        skill_id: "weather_forecast",
        skill_name: "Weather Forecast",
        skill_description: "Get weather forecasts for any location",
        skill_tags: "weather,forecast,prediction",
        skill_examples: '["What is the weather tomorrow?","Will it rain this weekend?"]',
        skill_input_modes: '["text"]',
        skill_output_modes: '["text"]'
      },
      {
        skill_id: "current_weather",
        skill_name: "Current Weather",
        skill_description: "Get current weather conditions",
        skill_tags: "weather,current,now",
        skill_examples: '["What is the weather now?","Is it raining?"]',
        skill_input_modes: '["text"]',
        skill_output_modes: '["text"]'
      }
    ]
  },
  {
    name: "StockTrader",
    description: "Analyzes stock market trends and provides trading insights",
    version: "2.1.0",
    url: "https://stocks.example.com",
    protocol_version: "0.3.0",
    default_input_modes: '["text","structured"]',
    default_output_modes: '["text","structured"]',
    streaming: true,
    push_notifications: true,
    state_transition_history: true,
    icon_url: "https://stocks.example.com/logo.png",
    documentation_url: "https://stocks.example.com/api",
    preferred_transport: "HTTP+JSON",
    skills: [
      {
        skill_id: "stock_analysis",
        skill_name: "Stock Analysis",
        skill_description: "Analyze stock performance and trends",
        skill_tags: "stocks,analysis,trading",
        skill_examples: '["Analyze AAPL stock","Show me TSLA trend"]',
        skill_input_modes: '["text"]',
        skill_output_modes: '["text","structured"]'
      },
      {
        skill_id: "portfolio_management",
        skill_name: "Portfolio Management",
        skill_description: "Manage and track investment portfolios",
        skill_tags: "portfolio,investment,tracking",
        skill_examples: '["Show my portfolio","Track my investments"]',
        skill_input_modes: '["text","structured"]',
        skill_output_modes: '["structured"]'
      }
    ]
  }
];

async function getWalletAddress(wallet: any): Promise<string | null> {
  const addressRaw = wallet.getIdentifier
    ? wallet.getIdentifier()
    : wallet.getAddress
      ? await wallet.getAddress()
      : null;

  if (!addressRaw) {
    return null;
  }

  return addressRaw.toString ? addressRaw.toString() : String(addressRaw);
}

function extractInteractionId(result: any): string | null {
  return result?.interaction_id
    ?? result?.result?.interaction_id
    ?? result?.output?.interaction_id
    ?? result?.ix_operations?.[0]?.data?.interaction_id
    ?? result?.ix_operations?.[0]?.data?.result?.interaction_id
    ?? null;
}

async function createMockInteractions(
  callerWallet: any,
  calleeWallet: any,
  callerSageoId: string,
  calleeSageoId: string
): Promise<boolean> {
  console.log('Creating mock interactions...');

  if (!INTERACTION_LOGIC_ID || INTERACTION_LOGIC_ID.trim() === '') {
    console.error('❌ INTERACTION_LOGIC_ID is not set in moi-client.ts.');
    console.error('   Please deploy the SageoInteractionLogic contract first.');
    return false;
  }

  // Load interaction manifest
  const interactionManifestPath = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');
  if (!fs.existsSync(interactionManifestPath)) {
    console.error(`❌ Interaction manifest not found at: ${interactionManifestPath}`);
    return false;
  }

  const interactionManifestYaml = fs.readFileSync(interactionManifestPath, 'utf-8');
  const interactionManifestYamlSafe = interactionManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const interactionManifest = yaml.load(interactionManifestYamlSafe) as any;

  // Create logic drivers with each agent's wallet
  const { LogicDriver } = await import('js-moi-sdk');
  const callerLogicDriver = new LogicDriver(INTERACTION_LOGIC_ID, interactionManifest, callerWallet);
  const calleeLogicDriver = new LogicDriver(INTERACTION_LOGIC_ID, interactionManifest, calleeWallet);

  const tryEnlist = async (
    driver: any,
    sageoId: string,
    label: string
  ): Promise<boolean> => {
    console.log(`\nEnlisting '${sageoId}' (${label})...`);
    try {
      const enlistIx = await driver.routines.Enlist(sageoId);
      await enlistIx.wait();
      console.log('✅ Enlisted!');
      return true;
    } catch (error) {
      const message = (error as Error).message || String(error);
      if (/already|exists|enlisted/i.test(message)) {
        console.log('ℹ️ Already enlisted.');
        return true;
      }
      console.error(`❌ Failed to enlist: ${message}`);
      return false;
    }
  };

  // 1. Enlist both agents for interaction logic (idempotent)
  const callerEnlisted = await tryEnlist(callerLogicDriver, callerSageoId, 'caller');
  if (!callerEnlisted) {
    return false;
  }
  const calleeEnlisted = await tryEnlist(calleeLogicDriver, calleeSageoId, 'callee');
  if (!calleeEnlisted) {
    return false;
  }

  // 2. Log Request (Interaction 1) - caller
  console.log('\nLogging Request 1 (caller)...');
  const ts1 = Math.floor(Date.now() / 1000);
  let interactionId1: string;
  try {
    const req1Ix = await callerLogicDriver.routines.LogRequest(
      '',  // empty string = generate new interaction_id
      calleeSageoId,  // counterparty (callee)
      true,  // is_sender = true
      'req_hash_1',
      'greeting',
      ts1,
      'ctx_1', 'task_1', 'msg_1', 'user_1', 'sess_1'
    );
    const req1Result = await req1Ix.wait();

    // Extract interaction_id - try result() method first
    try {
      const decoded = await req1Ix.result();
      interactionId1 = decoded?.output?.result_interaction_id ?? decoded?.result_interaction_id;
    } catch (e) {
      // Fall back to receipt
      interactionId1 = req1Result?.outputs?.[0] ?? extractInteractionId(req1Result);
    }

    if (!interactionId1) {
      console.error('❌ Failed to extract interaction_id');
      console.error('Receipt:', JSON.stringify(req1Result, null, 2));
      return false;
    }
    console.log(`✅ Got interaction_id: ${interactionId1}`);
  } catch (error) {
    console.error(`❌ Failed to log request 1: ${(error as Error).message}`);
    return false;
  }

  // 3. Log Request 1 (callee)
  console.log('Logging Request 1 (callee)...');
  try {
    const calleeReq1Ix = await calleeLogicDriver.routines.LogRequest(
      interactionId1,
      callerSageoId,  // counterparty (caller)
      false,  // is_sender = false (callee is receiving)
      'req_hash_1',
      'greeting',
      ts1,
      'ctx_1', 'task_1', 'msg_1', 'user_1', 'sess_1'
    );
    await calleeReq1Ix.wait();
  } catch (error) {
    console.error(`❌ Failed to log request 1 (callee): ${(error as Error).message}`);
    return false;
  }

  // 4. Log Response 1 (callee)
  console.log('Logging Response 1 (callee)...');
  try {
    const resp1Ix = await calleeLogicDriver.routines.LogResponse(
      interactionId1,
      callerSageoId,  // counterparty
      true,  // is_sender = true (callee is sending)
      'resp_hash_1',
      200,
      ts1 + 5
    );
    await resp1Ix.wait();
  } catch (error) {
    console.error(`❌ Failed to log response 1 (callee): ${(error as Error).message}`);
    return false;
  }

  // 5. Log Response 1 (caller)
  console.log('Logging Response 1 (caller)...');
  try {
    const callerResp1Ix = await callerLogicDriver.routines.LogResponse(
      interactionId1,
      calleeSageoId,  // counterparty
      false,  // is_sender = false (caller is receiving)
      'resp_hash_1',
      200,
      ts1 + 5
    );
    await callerResp1Ix.wait();
    console.log('✅ Interaction 1 Complete!');
  } catch (error) {
    console.error(`❌ Failed to log response 1 (caller): ${(error as Error).message}`);
    return false;
  }

  // 6. Log Request 2 (Failure case) - caller
  console.log('\nLogging Request 2 (Failure case, caller)...');
  let interactionId2: string;
  try {
    const req2Ix = await callerLogicDriver.routines.LogRequest(
      '',  // empty string = generate new interaction_id
      calleeSageoId,  // counterparty
      true,  // is_sender = true
      'req_hash_2',
      'payment',
      ts1 + 10,
      'ctx_1', 'task_2', 'msg_2', 'user_1', 'sess_1'
    );
    const req2Result = await req2Ix.wait();

    // Extract interaction_id
    try {
      const decoded = await req2Ix.result();
      interactionId2 = decoded?.output?.result_interaction_id ?? decoded?.result_interaction_id;
    } catch (e) {
      interactionId2 = req2Result?.outputs?.[0] ?? extractInteractionId(req2Result);
    }

    if (!interactionId2) {
      console.error('❌ Failed to extract interaction_id');
      return false;
    }
    console.log(`✅ Got interaction_id: ${interactionId2}`);
  } catch (error) {
    console.error(`❌ Failed to log request 2: ${(error as Error).message}`);
    return false;
  }

  // 7. Log Request 2 (callee)
  console.log('Logging Request 2 (callee)...');
  try {
    const calleeReq2Ix = await calleeLogicDriver.routines.LogRequest(
      interactionId2,
      callerSageoId,
      false,  // is_sender = false (callee is receiving)
      'req_hash_2',
      'payment',
      ts1 + 10,
      'ctx_1', 'task_2', 'msg_2', 'user_1', 'sess_1'
    );
    await calleeReq2Ix.wait();
  } catch (error) {
    console.error(`❌ Failed to log request 2 (callee): ${(error as Error).message}`);
    return false;
  }

  // 8. Log Response 2 (callee)
  console.log('Logging Response 2 (callee)...');
  try {
    const resp2Ix = await calleeLogicDriver.routines.LogResponse(
      interactionId2,
      callerSageoId,  // counterparty
      true,  // is_sender = true (callee is sending)
      'resp_hash_2',
      500,
      ts1 + 15
    );
    await resp2Ix.wait();
  } catch (error) {
    console.error(`❌ Failed to log response 2 (callee): ${(error as Error).message}`);
    return false;
  }

  // 9. Log Response 2 (caller)
  console.log('Logging Response 2 (caller)...');
  try {
    const callerResp2Ix = await callerLogicDriver.routines.LogResponse(
      interactionId2,
      calleeSageoId,  // counterparty
      false,  // is_sender = false (caller is receiving)
      'resp_hash_2',
      500,
      ts1 + 15
    );
    await callerResp2Ix.wait();
    console.log('✅ Interaction 2 Complete!');
  } catch (error) {
    console.error(`❌ Failed to log response 2 (caller): ${(error as Error).message}`);
    return false;
  }

  console.log('\n✅ All interactions logged successfully!');
  return true;
}

async function main(): Promise<boolean> {
  console.log('========================================');
  console.log('Sageo Mock Data + Interactions Creation');
  console.log('Network: Devnet (Hardcoded)');
  console.log('========================================\n');

  if (!IDENTITY_LOGIC_ID) {
    console.error('❌ IDENTITY_LOGIC_ID is not set in moi-client.ts. Please deploy contracts first.');
    return false;
  }

  let hasFailures = false;

  // Load agent mnemonics
  const mnemonicsPath = path.resolve(__dirname, 'agent_mnemonics.json');
  if (!fs.existsSync(mnemonicsPath)) {
    console.error('❌ agent_mnemonics.json not found!');
    console.error('   Please run register_agents.ts first: tsx scripts/register_agents.ts');
    return false;
  }

  console.log('📖 Loading agent mnemonics...');
  const mnemonicsData = JSON.parse(fs.readFileSync(mnemonicsPath, 'utf-8'));
  const agents = mnemonicsData.agents;

  if (!agents || agents.length === 0) {
    console.error('❌ No agents found in agent_mnemonics.json');
    return false;
  }

  console.log(`✅ Loaded ${agents.length} agent(s)\n`);

  // Initialize MOI provider
  console.log('🔧 Initializing MOI SDK...');
  const { VoyageProvider, Wallet } = await import('js-moi-sdk');
  const provider = new VoyageProvider('devnet');

  const firstAgent = agents.find((agent: any) => agent.sageo_id === 'agent_1');
  const secondAgent = agents.find((agent: any) => agent.sageo_id === 'agent_2');

  if (!firstAgent || !secondAgent) {
    console.error('❌ agent_1 and agent_2 not found in agent_mnemonics.json');
    return false;
  }

  console.log(`\n🔄 Creating interactions between:`);
  console.log(`   Caller: ${firstAgent.name} (${firstAgent.sageo_id})`);
  console.log(`   Callee: ${secondAgent.name} (${secondAgent.sageo_id})\n`);

  // Create wallets for both agents
  const callerWallet = await Wallet.fromMnemonic(firstAgent.mnemonic, MOI_DERIVATION_PATH);
  callerWallet.connect(provider);
  const calleeWallet = await Wallet.fromMnemonic(secondAgent.mnemonic, MOI_DERIVATION_PATH);
  calleeWallet.connect(provider);

  console.log(`✅ Using caller wallet: ${callerWallet.getIdentifier()}`);
  console.log(`✅ Using callee wallet: ${calleeWallet.getIdentifier()}\n`);

  // Create mock interactions using the agent's wallet
  const interactionSuccess = await createMockInteractions(
    callerWallet,
    calleeWallet,
    firstAgent.sageo_id,
    secondAgent.sageo_id
  );

  if (!interactionSuccess) {
    hasFailures = true;
  }

  return !hasFailures;
}

// Only run main() if this file is executed directly (not imported as a module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((success) => {
      if (success) {
        console.log('\n========================================');
        console.log('✨ Mock Interactions Creation SUCCESSFUL!');
        console.log('========================================\n');
        process.exit(0);
      } else {
        console.log('\n========================================');
        console.log('❌ Mock Interactions Creation FAILED');
        console.log('========================================\n');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Script failed:');
      console.error(error);
      process.exit(1);
    });
}

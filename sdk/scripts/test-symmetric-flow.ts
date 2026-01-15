#!/usr/bin/env tsx
/**
 * Test script for symmetric interaction logging
 * Demonstrates 4-call flow where both parties log request and response
 */

import { Wallet, VoyageProvider, LogicDriver } from 'js-moi-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import {
  INTERACTION_LOGIC_ID,
  MOI_DERIVATION_PATH,
} from '../../api/src/lib/moi-client.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded config
const MOI_NETWORK = 'devnet';
const AGENT_MNEMONICS_PATH = path.resolve(
  __dirname,
  '../../api/scripts/agent_mnemonics.json'
);

async function main() {
  console.log('========================================');
  console.log('Symmetric Interaction Logging Test');
  console.log('========================================\n');

  // Load manifest
  const manifestPath = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');
  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const manifest = yaml.load(manifestYamlSafe) as any;

  if (!fs.existsSync(AGENT_MNEMONICS_PATH)) {
    console.error(`❌ agent_mnemonics.json not found at ${AGENT_MNEMONICS_PATH}`);
    process.exit(1);
  }

  const mnemonicsData = JSON.parse(fs.readFileSync(AGENT_MNEMONICS_PATH, 'utf-8'));
  const agents = mnemonicsData.agents || [];
  if (agents.length < 2) {
    console.error('❌ Need at least two agents in agent_mnemonics.json');
    process.exit(1);
  }

  const [aliceAgent, bobAgent] = agents;

  // Initialize provider and wallets
  const provider = new VoyageProvider(MOI_NETWORK);
  const aliceWallet = await Wallet.fromMnemonic(aliceAgent.mnemonic, MOI_DERIVATION_PATH);
  aliceWallet.connect(provider);
  const bobWallet = await Wallet.fromMnemonic(bobAgent.mnemonic, MOI_DERIVATION_PATH);
  bobWallet.connect(provider);

  console.log(`Alice: ${aliceWallet.getIdentifier()} (${aliceAgent.sageo_id})`);
  console.log(`Bob: ${bobWallet.getIdentifier()} (${bobAgent.sageo_id})\n`);

  const aliceDriver = new LogicDriver(INTERACTION_LOGIC_ID, manifest, aliceWallet);
  const bobDriver = new LogicDriver(INTERACTION_LOGIC_ID, manifest, bobWallet);

  // Step 1: Alice (caller) logs request - GENERATES interaction_id
  console.log('Step 1: Alice logs request (generates ID)...');
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  const aliceLogReq = await aliceDriver.routines.LogRequest(
    '',  // empty = generate new ID
    bobAgent.sageo_id,
    true,  // is_sender = true (Alice is the sender)
    'hash_request_123',
    'get_weather',
    timestamp,
    'ctx_001',
    'task_001',
    'msg_001',
    'user_001',
    'session_001'
  );
  const aliceReqResult = await aliceLogReq.send({ fuelPrice: 1, fuelLimit: 2000 });
  const aliceReqReceipt = await aliceReqResult.wait();
  
  // Extract interaction_id
  const interactionId = aliceReqReceipt.outputs?.[0] ?? 
                       (aliceReqReceipt as any).result?.result_interaction_id ??
                       (aliceReqReceipt as any).output?.result_interaction_id;
  
  if (!interactionId) {
    console.error('❌ Failed to get interaction_id from Step 1');
    console.log('Receipt:', JSON.stringify(aliceReqReceipt, null, 2));
    process.exit(1);
  }
  
  console.log(`✅ Alice logged request, ID: ${interactionId}\n`);

  // Step 2: Bob (callee) logs request - USES same interaction_id
  console.log(`Step 2: Bob logs request (uses ID: ${interactionId})...`);
  const bobLogReq = await bobDriver.routines.LogRequest(
    interactionId,  // use Alice's ID
    aliceAgent.sageo_id,
    false,  // is_sender = false (Bob is the receiver)
    'hash_request_123',
    'get_weather',
    timestamp,
    'ctx_001',
    'task_001',
    'msg_001',
    'user_001',
    'session_001'
  );
  const bobReqResult = await bobLogReq.send({ fuelPrice: 1, fuelLimit: 2000 });
  await bobReqResult.wait();
  console.log('✅ Bob logged request\n');

  // Step 3: Bob (callee) logs response
  console.log(`Step 3: Bob logs response (ID: ${interactionId})...`);
  const timestamp2 = BigInt(Math.floor(Date.now() / 1000) + 1);
  const bobLogResp = await bobDriver.routines.LogResponse(
    interactionId,
    aliceAgent.sageo_id,
    true,  // is_sender = true (Bob is sending the response)
    'hash_response_456',
    200n,
    timestamp2
  );
  const bobRespResult = await bobLogResp.send({ fuelPrice: 1, fuelLimit: 2000 });
  await bobRespResult.wait();
  console.log('✅ Bob logged response\n');

  // Step 4: Alice (caller) logs response
  console.log(`Step 4: Alice logs response (ID: ${interactionId})...`);
  const aliceLogResp = await aliceDriver.routines.LogResponse(
    interactionId,
    bobAgent.sageo_id,
    false,  // is_sender = false (Alice is receiving the response)
    'hash_response_456',
    200n,
    timestamp2
  );
  const aliceRespResult = await aliceLogResp.send({ fuelPrice: 1, fuelLimit: 2000 });
  await aliceRespResult.wait();
  console.log('✅ Alice logged response\n');

  // Verify: Check both agents' interactions
  console.log('========================================');
  console.log('Verification: Querying interactions');
  console.log('========================================\n');

  console.log('Alice\'s interactions:');
  const aliceInteractions = await aliceDriver.routines.ListInteractionsByAgent(
    aliceWallet.getIdentifier(),
    10n,
    0n
  );
  const aliceOutput = Array.isArray(aliceInteractions)
    ? { records: aliceInteractions[0], total: aliceInteractions[1] }
    : (aliceInteractions as any)?.output ?? aliceInteractions;
  console.log(`Total: ${aliceOutput.total}`);
  console.log('Records:', JSON.stringify(aliceOutput.records, null, 2));

  console.log('\nBob\'s interactions:');
  const bobInteractions = await bobDriver.routines.ListInteractionsByAgent(
    bobWallet.getIdentifier(),
    10n,
    0n
  );
  const bobOutput = Array.isArray(bobInteractions)
    ? { records: bobInteractions[0], total: bobInteractions[1] }
    : (bobInteractions as any)?.output ?? bobInteractions;
  console.log(`Total: ${bobOutput.total}`);
  console.log('Records:', JSON.stringify(bobOutput.records, null, 2));

  console.log('\n========================================');
  console.log('✨ Symmetric flow test complete!');
  console.log('========================================');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  });

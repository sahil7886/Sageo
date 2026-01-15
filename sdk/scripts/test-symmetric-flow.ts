#!/usr/bin/env tsx
/**
 * Test script for symmetric interaction logging
 * Demonstrates 4-call flow where both parties log request and response
 */

import { Wallet, VoyageProvider } from 'js-moi-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded config
const MOI_NETWORK = 'devnet';
const MOI_MNEMONIC = "repair cycle monitor satisfy warfare forest decorate reveal update economy pizza lift";
const MOI_DERIVATION_PATH_1 = "m/44'/6174'/7020'/0/0"; // Alice
const MOI_DERIVATION_PATH_2 = "m/44'/6174'/7020'/0/1"; // Bob
const INTERACTION_LOGIC_ID = "0x200000006b02c2beead8f04745dd36e14512c4cc2b20ff8c722cb9fc00000000";
const IDENTITY_LOGIC_ID = "0x20000000b7121d400803c8af891614911c1df6b8c1e9aff64e788a0c00000000";

async function main() {
  console.log('========================================');
  console.log('Symmetric Interaction Logging Test');
  console.log('========================================\n');

  // Load manifest
  const manifestPath = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');
  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const manifest = yaml.load(manifestYamlSafe) as any;

  // Initialize provider and wallets
  const provider = new VoyageProvider(MOI_NETWORK);
  const aliceWallet = await Wallet.fromMnemonic(MOI_MNEMONIC, MOI_DERIVATION_PATH_1);
  aliceWallet.connect(provider);
  const bobWallet = await Wallet.fromMnemonic(MOI_MNEMONIC, MOI_DERIVATION_PATH_2);
  bobWallet.connect(provider);

  console.log(`Alice: ${aliceWallet.getIdentifier()}`);
  console.log(`Bob: ${bobWallet.getIdentifier()}\n`);

  // Import LogicDriver  
  const { LogicDriver } = await import('js-moi-sdk');
  
  const aliceDriver = new LogicDriver(INTERACTION_LOGIC_ID, manifest, aliceWallet);
  const bobDriver = new LogicDriver(INTERACTION_LOGIC_ID, manifest, bobWallet);

  // Step 0: Enlist both agents
  console.log('Step 0: Enlisting agents...');
  try {
    const aliceEnlist = await aliceDriver.routines.Enlist('agent_alice');
    await (await aliceEnlist.send({ fuelPrice: 1, fuelLimit: 1000 })).wait();
    console.log('✅ Alice enlisted');
  } catch (e) {
    console.log('⏭️  Alice already enlisted');
  }

  try {
    const bobEnlist = await bobDriver.routines.Enlist('agent_bob');
    await (await bobEnlist.send({ fuelPrice: 1, fuelLimit: 1000 })).wait();
    console.log('✅ Bob enlisted\n');
  } catch (e) {
    console.log('⏭️  Bob already enlisted\n');
  }

  // Step 1: Alice (caller) logs request - GENERATES interaction_id
  console.log('Step 1: Alice logs request (generates ID)...');
  const timestamp = BigInt(Date.now());
  const aliceLogReq = await aliceDriver.routines.LogRequest(
    '',  // empty = generate new ID
    'agent_bob',
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
    'agent_alice',
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
  const timestamp2 = BigInt(Date.now() + 1000);
  const bobLogResp = await bobDriver.routines.LogResponse(
    interactionId,
    'agent_alice',
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
    'agent_bob',
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
  console.log(`Total: ${aliceInteractions.total}`);
  console.log('Records:', JSON.stringify(aliceInteractions.records, null, 2));

  console.log('\nBob\'s interactions:');
  const bobInteractions = await bobDriver.routines.ListInteractionsByAgent(
    bobWallet.getIdentifier(),
    10n,
    0n
  );
  console.log(`Total: ${bobInteractions.total}`);
  console.log('Records:', JSON.stringify(bobInteractions.records, null, 2));

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

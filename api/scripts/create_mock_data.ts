#!/usr/bin/env tsx
/**
 * Script to create mock agents on the deployed SageoIdentityLogic contract
 */

import { initializeMOI, getWallet, getProvider, getLogicDriver, IDENTITY_LOGIC_ID } from '../src/lib/moi-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled contract manifests
const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');

const MOCK_AGENTS = [
  {
    name: "WeatherBot",
    description: "Provides weather updates",
    version: "1.0.0",
    url: "https://weather.example.com",
    protocol_version: "0.1.0",
    icon_url: "https://weather.example.com/icon.png",
    documentation_url: "https://weather.example.com/docs",
    preferred_transport: "http",
    default_input_modes: "text",
    default_output_modes: "text",
    streaming: false,
    push_notifications: false
  },
  {
    name: "StockTrader",
    description: "Analyzes stock market trends",
    version: "2.1.0",
    url: "https://stocks.example.com",
    protocol_version: "0.1.0",
    icon_url: "https://stocks.example.com/logo.png",
    documentation_url: "https://stocks.example.com/api",
    preferred_transport: "http",
    default_input_modes: "json",
    default_output_modes: "json",
    streaming: true,
    push_notifications: true
  }
];

async function main() {
  console.log('========================================');
  console.log('Sageo Mock Data Creation');
  console.log('Network: Devnet (Hardcoded)');
  console.log('========================================\n');

  if (!IDENTITY_LOGIC_ID) {
    console.error('❌ IDENTITY_LOGIC_ID is not set in moi-client.ts. Please deploy contracts first.');
    process.exit(1);
  }

  // Initialize MOI SDK
  console.log('🔧 Initializing MOI SDK...');
  await initializeMOI();
  const wallet = getWallet();
  const address = (wallet as any).getAddress ? await (wallet as any).getAddress() : (wallet as any).getIdentifier ? (wallet as any).getIdentifier() : 'unknown';
  console.log(`✅ Wallet address: ${address}\n`);

  // Load manifest
  console.log('📖 Loading manifest...');
  if (!fs.existsSync(IDENTITY_MANIFEST_PATH)) {
    console.error(`❌ Identity manifest not found at: ${IDENTITY_MANIFEST_PATH}`);
    process.exit(1);
  }
  const identityManifestYaml = fs.readFileSync(IDENTITY_MANIFEST_PATH, 'utf-8');
  // Hack: Quote hex values to prevent js-yaml from parsing them as numbers if they are large
  const identityManifestYamlSafe = identityManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const identityManifest = yaml.load(identityManifestYamlSafe) as any;

  // Get logic driver
  console.log(`🔗 Connecting to logic at ${IDENTITY_LOGIC_ID}...`);
  const logicDriver = await getLogicDriver(IDENTITY_LOGIC_ID, identityManifest);

  // Register agents
  console.log('\n🤖 Registering mock agents...');
  
  // First, we need to enlist ourselves if not already enlisted?
  // The contract has an Enlist function. Let's try calling it.
  try {
    console.log('📝 Enlisting sender...');
    const enlistIx = await logicDriver.routines.Enlist();
    await enlistIx.wait();
    console.log('✅ Enlisted successfully');
  } catch (error) {
    console.log('⚠️  Enlistment might have failed or already enlisted:', (error as Error).message);
  }

  for (const agent of MOCK_AGENTS) {
    console.log(`\nRegistering ${agent.name}...`);
    try {
      const ix = await logicDriver.routines.RegisterAgent(
        agent.name,
        agent.description,
        agent.version,
        agent.url,
        agent.protocol_version,
        agent.icon_url,
        agent.documentation_url,
        agent.preferred_transport,
        agent.default_input_modes,
        agent.default_output_modes,
        agent.streaming,
        agent.push_notifications
      );
      
      console.log(`⏳ Waiting for confirmation... (Hash: ${ix.hash})`);
      const receipt = await ix.wait();
      
      // Extract sageo_id from result if possible
      // The return values are (sageo_id, profile)
      // Depending on SDK, receipt.result might contain this
      console.log(`✅ Registered ${agent.name}`);
      // console.log('Receipt:', JSON.stringify(receipt, null, 2));
      
    } catch (error) {
      console.error(`❌ Failed to register ${agent.name}:`, (error as Error).message);
    }
  }

  console.log('\n========================================');
  console.log('Mock Data Creation Complete!');
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

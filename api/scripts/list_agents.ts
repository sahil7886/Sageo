#!/usr/bin/env tsx
/**
 * Script to list all agents from the deployed SageoIdentityLogic contract
 */

import { initializeMOI, getWallet, getLogicDriver, IDENTITY_LOGIC_ID } from '../src/lib/moi-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled contract manifests
const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');

async function main() {
  console.log('========================================');
  console.log('Sageo Agent List');
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
  console.log(`✅ Wallet initialized\n`);

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

  try {
    // Get all agent IDs
    console.log('\n🔍 Fetching all agent IDs...');
    // GetAllAgentIds returns (ids []String)
    const result = await logicDriver.routines.GetAllAgentIds();
    
    console.log('Raw result type:', typeof result);
    console.log('Raw result:', JSON.stringify(result, null, 2));
    
    let agentIds: string[] = [];
    if (Array.isArray(result)) {
        agentIds = result;
    } else if (result && typeof result === 'object' && 'ids' in result) {
        agentIds = (result as any).ids;
    } else if (result && typeof result === 'object' && 'output' in result) {
         const output = (result as any).output;
         if (output && 'ids' in output) {
             agentIds = output.ids;
         } else if (Array.isArray(output)) {
             agentIds = output;
         }
    } else if (result && typeof result === 'object') {
        // Maybe it's just the object itself if keys are indices? Or wrapped differently
        // Try to find any array property
        const values = Object.values(result);
        const arrayVal = values.find(v => Array.isArray(v));
        if (arrayVal) agentIds = arrayVal as string[];
    } 
    
    if (!agentIds) agentIds = []; // Ensure it's an array

    console.log(`✅ Found ${agentIds.length} agents:\n`);
    
    for (const id of agentIds) {
        console.log(`- ${id}`);
    }
    
    if (agentIds.length > 0) {
        console.log('\n💡 Try querying one of these IDs with:');
        console.log(`   curl http://localhost:3001/agents/${agentIds[0]}`);
    }

  } catch (error) {
    console.error(`❌ Failed to fetch agents:`, (error as Error).message);
  }

  console.log('\n========================================');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

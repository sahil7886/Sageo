#!/usr/bin/env tsx
/**
 * Deployment script for Sageo contracts to MOI Devnet
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeMOI, deployLogic } from '../src/lib/moi-client.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled contract manifests
const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');
const INTERACTION_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');

async function main() {
  console.log('========================================');
  console.log('Sageo Contract Deployment');
  console.log('Network: Devnet (Hardcoded)');
  console.log('========================================\n');

  // Initialize MOI SDK
  console.log('🔧 Initializing MOI SDK...');
  // Uses hardcoded constants from moi-client.ts
  const { wallet } = await initializeMOI();
  
  const address = (wallet as any).getAddress ? await (wallet as any).getAddress() : (wallet as any).getIdentifier ? (wallet as any).getIdentifier() : 'unknown';
  console.log(`✅ Wallet address: ${address}\n`);

  // Deploy Identity Logic
  console.log('📦 Deploying SageoIdentityLogic...');
  if (!fs.existsSync(IDENTITY_MANIFEST_PATH)) {
    console.error(`❌ Identity manifest not found at: ${IDENTITY_MANIFEST_PATH}`);
    console.error('   Run: cd moi/SageoIdentityLogic && coco compile .');
    process.exit(1);
  }

  const identityManifestYaml = fs.readFileSync(IDENTITY_MANIFEST_PATH, 'utf-8');
  // Hack: Quote hex values to prevent js-yaml from parsing them as numbers if they are large
  const identityManifestYamlSafe = identityManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const identityManifest = yaml.load(identityManifestYamlSafe) as any;
  
  // Skip deployment if already deployed (manually checked from moi-client.ts or just allow redeploy)
  // For now, allow redeploy but logging that we can skip if needed
  console.log('Deploying Identity Logic...');
  const identityLogicId = await deployLogic(identityManifest, wallet);
  console.log(`✅ SageoIdentityLogic deployed: ${identityLogicId}\n`);

  // Deploy Interaction Logic
  console.log('📦 Deploying SageoInteractionLogic...');
  if (!fs.existsSync(INTERACTION_MANIFEST_PATH)) {
    console.error(`❌ Interaction manifest not found at: ${INTERACTION_MANIFEST_PATH}`);
    console.error('   Run: cd moi/SageoInteractionLogic && coco compile .');
    process.exit(1);
  }

  const interactionManifestYaml = fs.readFileSync(INTERACTION_MANIFEST_PATH, 'utf-8');
  // Hack: Quote hex values to prevent js-yaml from parsing them as numbers if they are large
  const interactionManifestYamlSafe = interactionManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const interactionManifest = yaml.load(interactionManifestYamlSafe) as any;
  const interactionLogicId = await deployLogic(interactionManifest, wallet);
  console.log(`✅ SageoInteractionLogic deployed: ${interactionLogicId}\n`);


  // Print summary
  console.log('========================================');
  console.log('✨ Deployment Complete!');
  console.log('========================================\n');
  console.log('Please update api/src/lib/moi-client.ts with these addresses:');
  console.log(`export const IDENTITY_LOGIC_ID = "${identityLogicId}";`);
  console.log(`export const INTERACTION_LOGIC_ID = "${interactionLogicId}";`);
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });

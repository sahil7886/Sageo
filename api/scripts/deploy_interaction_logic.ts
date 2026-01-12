#!/usr/bin/env tsx
/**
 * Deployment script for SageoInteractionLogic contract to MOI Devnet
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeMOI, deployLogic } from '../src/lib/moi-client.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled contract manifest
const INTERACTION_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');

async function main() {
    console.log('========================================');
    console.log('SageoInteractionLogic Contract Deployment');
    console.log('Network: Devnet (Hardcoded)');
    console.log('========================================\n');

    // Initialize MOI SDK
    console.log('🔧 Initializing MOI SDK...');
    const { wallet } = await initializeMOI();

    const address = (wallet as any).getAddress ? await (wallet as any).getAddress() : (wallet as any).getIdentifier ? (wallet as any).getIdentifier() : 'unknown';
    console.log(`✅ Wallet address: ${address}\n`);

    // Deploy InteractionLogic
    console.log('📦 Deploying SageoInteractionLogic...');
    if (!fs.existsSync(INTERACTION_MANIFEST_PATH)) {
        console.error(`❌ InteractionLogic manifest not found at: ${INTERACTION_MANIFEST_PATH}`);
        console.error('   Run: cd contract/SageoInteractionLogic && coco compile .');
        process.exit(1);
    }

    const manifestYaml = fs.readFileSync(INTERACTION_MANIFEST_PATH, 'utf-8');
    // Hack: Quote hex values to prevent js-yaml from parsing them as numbers if they are large
    const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
    const manifest = yaml.load(manifestYamlSafe) as any;

    console.log('Deploying SageoInteractionLogic...');
    const interactionLogicId = await deployLogic(manifest, wallet);
    console.log(`✅ SageoInteractionLogic deployed: ${interactionLogicId}\n`);
    
    console.log('========================================');
    console.log('Next Steps:');
    console.log('========================================');
    console.log(`1. Update INTERACTION_LOGIC_ID in api/src/lib/moi-client.ts:`);
    console.log(`   export const INTERACTION_LOGIC_ID = "${interactionLogicId}";`);
    console.log('');
    console.log('2. Then you can run create_mock_interactions.ts');
    console.log('========================================\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Deployment failed:');
        console.error(error);
        process.exit(1);
    });

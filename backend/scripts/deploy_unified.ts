#!/usr/bin/env tsx
/**
 * Deployment script for Sageo unified contract to MOI Devnet
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeMOI, deployLogic } from '../src/lib/moi-client.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to compiled unified contract manifest
const SAGEO_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoLogic/sageologic.yaml');

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

    // Deploy Unified SageoLogic
    console.log('📦 Deploying SageoLogic (unified identity + interactions)...');
    if (!fs.existsSync(SAGEO_MANIFEST_PATH)) {
        console.error(`❌ SageoLogic manifest not found at: ${SAGEO_MANIFEST_PATH}`);
        console.error('   Run: cd contract/SageoLogic && coco compile .');
        process.exit(1);
    }

    const sageoManifestYaml = fs.readFileSync(SAGEO_MANIFEST_PATH, 'utf-8');
    // Hack: Quote hex values to prevent js-yaml from parsing them as numbers if they are large
    const sageoManifestYamlSafe = sageoManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
    const sageoManifest = yaml.load(sageoManifestYamlSafe) as any;

    console.log('Deploying SageoLogic...');
    const sageoLogicId = await deployLogic(sageoManifest, wallet);
    console.log(`✅ SageoLogic deployed: ${sageoLogicId}\n`);

    // Print summary
    console.log('========================================');
    console.log('✨ Deployment Complete!');
    console.log('========================================\n');
    console.log('Please update api/src/lib/moi-client.ts with this address:');
    console.log(`export const SAGEO_LOGIC_ID = "${sageoLogicId}";`);
    console.log('========================================\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Deployment failed:');
        console.error(error);
        process.exit(1);
    });

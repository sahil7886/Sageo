#!/usr/bin/env tsx
/**
 * Main deployment script for Sageo contracts to MOI Devnet
 * Deploys both IdentityLogic and InteractionLogic contracts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeMOI, deployLogic } from '../src/lib/moi-client.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to compiled contract manifests
const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');
const INTERACTION_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');

async function main() {
    console.log('========================================');
    console.log('Sageo Contracts Deployment');
    console.log('Network: Devnet (Hardcoded)');
    console.log('========================================\n');

    // Initialize MOI SDK
    console.log('🔧 Initializing MOI SDK...');
    const { wallet } = await initializeMOI();

    const address = (wallet as any).getAddress ? await (wallet as any).getAddress() : (wallet as any).getIdentifier ? (wallet as any).getIdentifier() : 'unknown';
    console.log(`✅ Wallet address: ${address}\n`);

    const deployedContracts: { name: string; id: string }[] = [];

    // Deploy IdentityLogic
    console.log('📦 Deploying SageoIdentityLogic...');
    if (!fs.existsSync(IDENTITY_MANIFEST_PATH)) {
        console.error(`❌ IdentityLogic manifest not found at: ${IDENTITY_MANIFEST_PATH}`);
        console.error('   Run: cd contract/SageoIdentityLogic && coco compile .');
        process.exit(1);
    }

    const identityManifestYaml = fs.readFileSync(IDENTITY_MANIFEST_PATH, 'utf-8');
    const identityManifestYamlSafe = identityManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
    const identityManifest = yaml.load(identityManifestYamlSafe) as any;

    try {
        const identityLogicId = await deployLogic(identityManifest, wallet);
        console.log(`✅ SageoIdentityLogic deployed: ${identityLogicId}\n`);
        deployedContracts.push({ name: 'IDENTITY_LOGIC_ID', id: identityLogicId });
    } catch (error) {
        console.error(`❌ Failed to deploy IdentityLogic: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        process.exit(1);
    }

    // Deploy InteractionLogic
    console.log('📦 Deploying SageoInteractionLogic...');
    if (!fs.existsSync(INTERACTION_MANIFEST_PATH)) {
        console.error(`❌ InteractionLogic manifest not found at: ${INTERACTION_MANIFEST_PATH}`);
        console.error('   Run: cd contract/SageoInteractionLogic && coco compile .');
        process.exit(1);
    }

    const interactionManifestYaml = fs.readFileSync(INTERACTION_MANIFEST_PATH, 'utf-8');
    const interactionManifestYamlSafe = interactionManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
    const interactionManifest = yaml.load(interactionManifestYamlSafe) as any;

    try {
        const interactionLogicId = await deployLogic(interactionManifest, wallet);
        console.log(`✅ SageoInteractionLogic deployed: ${interactionLogicId}\n`);
        deployedContracts.push({ name: 'INTERACTION_LOGIC_ID', id: interactionLogicId });
    } catch (error) {
        console.error(`❌ Failed to deploy InteractionLogic: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        process.exit(1);
    }

    // Print summary
    console.log('========================================');
    console.log('✨ Deployment Complete!');
    console.log('========================================\n');
    console.log('Please update api/src/lib/moi-client.ts with these addresses:\n');
    deployedContracts.forEach(({ name, id }) => {
        console.log(`export const ${name} = "${id}";`);
    });
    console.log('\n========================================\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Deployment failed:');
        console.error(error);
        process.exit(1);
    });

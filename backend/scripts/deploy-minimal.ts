#!/usr/bin/env tsx
/**
 * Test deployment script for minimal contract
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeMOI, deployLogic } from '../src/lib/moi-client.js';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.resolve(__dirname, '../../contract/SageoLogicMinimal/sageologicminimal.yaml');

async function main() {
  console.log('Testing minimal contract deployment...\n');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const manifest = yaml.load(manifestYamlSafe) as any;

  const { wallet } = await initializeMOI();
  console.log('Deploying minimal contract...');

  try {
    const logicId = await deployLogic(manifest, wallet);
    console.log('SUCCESS: Logic ID:', logicId);
  } catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
}

main();

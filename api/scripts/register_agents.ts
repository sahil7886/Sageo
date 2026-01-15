#!/usr/bin/env tsx
/**
 * Agent Registration Script
 * Generates wallets for test agents, funds them, and registers them on-chain
 * Saves agent info (including mnemonics) to agent_mnemonics.json for later use
 */

import { Wallet, VoyageProvider, LogicDriver } from 'js-moi-sdk';
import { generateMnemonic } from 'js-moi-bip39';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { MOCK_AGENTS } from './create_mock_data.js';
import { IDENTITY_LOGIC_ID, MOI_DERIVATION_PATH } from '../src/lib/moi-client.js';
// Faucet import removed - manual funding required due to SDK bug
// import { distributeTokens, fundWalletsViaDistributor } from '../src/lib/faucet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MOI_NETWORK = 'devnet';
const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');
const OUTPUT_FILE = path.resolve(__dirname, 'agent_mnemonics.json');

interface AgentInfo {
  name: string;
  sageo_id: string;
  mnemonic: string;
  wallet_address: string;
  created_at: string;
}

interface AgentMnemonicsFile {
  created_at: string;
  agents: AgentInfo[];
}

async function main() {
  
  console.log('========================================');
  console.log('Agent Registration with Independent Wallets');
  console.log('Network: Devnet');
  console.log('Note: Manual funding required (SDK bug)');
  console.log('========================================\n');

  // Load identity manifest
  console.log('📖 Loading Identity manifest...');
  if (!fs.existsSync(IDENTITY_MANIFEST_PATH)) {
    console.error(`❌ Identity manifest not found at: ${IDENTITY_MANIFEST_PATH}`);
    console.error('   Run: cd contract/SageoIdentityLogic && coco compile .');
    process.exit(1);
  }

  const identityManifestYaml = fs.readFileSync(IDENTITY_MANIFEST_PATH, 'utf-8');
  const identityManifestYamlSafe = identityManifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const identityManifest = yaml.load(identityManifestYamlSafe) as any;

  // Initialize provider
  const provider = new VoyageProvider(MOI_NETWORK);
  
  // Get deployer wallet (for signing registration transactions)
  const deployerMnemonic = "repair cycle monitor satisfy warfare forest decorate reveal update economy pizza lift";
  const deployerWallet = await Wallet.fromMnemonic(deployerMnemonic, MOI_DERIVATION_PATH);
  deployerWallet.connect(provider);
  
  console.log(`✅ Deployer wallet: ${deployerWallet.getIdentifier()}\n`);

  // Create logic driver with deployer wallet
  const logicDriver = new LogicDriver(IDENTITY_LOGIC_ID, identityManifest, deployerWallet);

  // Get initial agent count
  let nextAgentNumber = 1;
  try {
    const countResult = await logicDriver.routines.GetAgentCount();
    const count = countResult?.output?.count ?? countResult?.count ?? 0;
    nextAgentNumber = Number(count) + 1;
    console.log(`📊 Current agent count: ${count}`);
    console.log(`   Next agents will start from: agent_${nextAgentNumber}\n`);
  } catch (err) {
    console.log('⚠️  Could not get current agent count, starting from 1\n');
  }

  const registeredAgents: AgentInfo[] = [];
  const agentWallets: { wallet_address: string; mnemonic: string; agent: typeof MOCK_AGENTS[0] }[] = [];

  // Step 1: Generate wallets for all agents
  console.log('🔑 Step 1: Generating wallets for agents...\n');
  for (const agent of MOCK_AGENTS) {
    const mnemonic = generateMnemonic();
    const agentWallet = await Wallet.fromMnemonic(mnemonic, MOI_DERIVATION_PATH);
    const wallet_address = agentWallet.getIdentifier();

    console.log(`✅ ${agent.name}: ${wallet_address}`);
    agentWallets.push({ wallet_address, mnemonic, agent });
  }

  // Step 2: Register agents on-chain (using deployer wallet)
  console.log('\n📝 Step 2: Registering agents on-chain...\n');

  // Register each agent on-chain
  for (const { wallet_address, mnemonic, agent } of agentWallets) {
    console.log(`\n🤖 Registering: ${agent.name}`);
    console.log('━'.repeat(50));

    try {
      console.log(`🔑 Wallet: ${wallet_address}`);

      // Register agent on-chain
      console.log('📝 Registering on-chain...');
      
      const timestamp = Math.floor(Date.now() / 1000);
      // Convert Identifier to string
      const walletAddressString = wallet_address.toString();
      
      const ix = await logicDriver.routines.RegisterAgent(
        agent.name,
        agent.description,
        agent.version,
        agent.url,
        agent.protocol_version,
        agent.default_input_modes,
        agent.default_output_modes,
        agent.streaming,
        agent.push_notifications,
        agent.state_transition_history,
        agent.icon_url,
        agent.documentation_url,
        agent.preferred_transport,
        walletAddressString,
        timestamp
      );

      console.log(`⏳ Waiting for confirmation... (Hash: ${ix.hash})`);
      await ix.wait();

      const sageo_id = `agent_${nextAgentNumber}`;
      nextAgentNumber++;

      console.log(`✅ Registered as: ${sageo_id}`);

      // Add skills
      if (agent.skills && agent.skills.length > 0) {
        console.log(`   Adding ${agent.skills.length} skill(s)...`);
        for (const skill of agent.skills) {
          const skillIx = await logicDriver.routines.AddSkill(
            sageo_id,
            skill.skill_id,
            skill.skill_name,
            skill.skill_description,
            skill.skill_tags,
            skill.skill_examples,
            skill.skill_input_modes,
            skill.skill_output_modes
          );
          await skillIx.wait();
          console.log(`   ✅ Added skill: ${skill.skill_name}`);
        }
      }

      // Store agent info
      registeredAgents.push({
        name: agent.name,
        sageo_id,
        mnemonic,
        wallet_address,
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Failed to register ${agent.name}:`);
      console.error(`   ${(error as Error).message}`);
      process.exit(1);
    }
  }

  // Save to file
  console.log('\n' + '='.repeat(50));
  console.log('💾 Saving agent information...');
  
  const outputData: AgentMnemonicsFile = {
    created_at: new Date().toISOString(),
    agents: registeredAgents
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ Saved to: ${OUTPUT_FILE}`);

  // Print manual funding instructions
  console.log('\n' + '━'.repeat(70));
  console.log('💰 MANUAL FUNDING REQUIRED');
  console.log('━'.repeat(70));
  console.log('⚠️  Agent wallets need funding before running create_mock_data.ts\n');
  console.log('📝 Import these mnemonics into Voyage wallet, then fund each:\n');
  
  registeredAgents.forEach(agent => {
    console.log(`🤖 ${agent.sageo_id} - ${agent.name}`);
    console.log(`   Address:  ${agent.wallet_address}`);
    console.log(`   Mnemonic: ${agent.mnemonic}`);
    console.log('');
  });
  
  console.log('━'.repeat(70));
  console.log('📍 Fund at: https://voyage.moi.technology/faucet');
  console.log('💡 Each wallet needs ~10,000 tokens');
  console.log(`📂 Mnemonics saved to: ${OUTPUT_FILE}`);
  console.log('━'.repeat(70));
  console.log('\n✅ Next: Fund wallets, then run: npx tsx scripts/create_mock_data.ts\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Registration failed:');
    console.error(error);
    process.exit(1);
  });

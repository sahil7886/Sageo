#!/usr/bin/env tsx
/**
 * Inspect interaction actor state directly from on-chain storage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { LogicDriver } from 'js-moi-sdk';
import { initializeMOI, INTERACTION_LOGIC_ID } from '../src/lib/moi-client.js';
import { normalizeAgentIdentifier } from '../src/lib/agent-mnemonics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MNEMONICS_PATH = path.resolve(__dirname, 'agent_mnemonics.json');
const MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');

type AgentInfo = {
  name?: string;
  sageo_id?: string;
  wallet_address?: string;
};

type AgentMnemonicsFile = {
  agents?: AgentInfo[];
};

function formatValue(value: unknown): string {
  if (typeof value === 'bigint') return value.toString();
  return String(value);
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('Sageo Interaction Actor State Inspect');
  console.log('========================================\n');

  if (!INTERACTION_LOGIC_ID) {
    console.error('❌ INTERACTION_LOGIC_ID is not set in moi-client.ts');
    process.exit(1);
  }

  if (!fs.existsSync(MNEMONICS_PATH)) {
    console.error(`❌ agent_mnemonics.json not found at ${MNEMONICS_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Interaction manifest not found at ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const mnemonicsData = JSON.parse(fs.readFileSync(MNEMONICS_PATH, 'utf-8')) as AgentMnemonicsFile;
  const agents = mnemonicsData.agents ?? [];
  if (agents.length === 0) {
    console.error('❌ No agents found in agent_mnemonics.json');
    process.exit(1);
  }

  const manifestYaml = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const manifest = yaml.load(manifestYamlSafe) as any;

  const { wallet } = await initializeMOI(process.env.MOI_MNEMONIC);
  const logicDriver = new LogicDriver(INTERACTION_LOGIC_ID, manifest, wallet);

  if (!logicDriver.ephemeralState) {
    console.error('❌ Interaction logic does not expose actor (ephemeral) state');
    process.exit(1);
  }

  for (const agent of agents) {
    const sageoId = agent.sageo_id ?? '(unknown)';
    const addressRaw = agent.wallet_address ?? '';
    const address = normalizeAgentIdentifier(addressRaw);

    console.log(`\n🤖 ${sageoId} - ${agent.name ?? 'Unnamed'}`);
    console.log(`   Address: ${address || '(missing)'}`);

    if (!address) {
      console.log('   ⚠️  Missing wallet address; skipping.');
      continue;
    }

    try {
      const agentId = await logicDriver.ephemeralState.get(address, (builder) => builder.entity('agent_id'));
      const interactionCounter = await logicDriver.ephemeralState.get(address, (builder) => builder.entity('interaction_counter'));
      const interactionsLen = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('interactions').length()
      );
      const counterpartiesLen = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('counterparties').length()
      );
      const statsTotalRequestsSent = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('stats_total_requests_sent')
      );
      const statsTotalRequestsReceived = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('stats_total_requests_received')
      );
      const statsTotalResponsesSent = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('stats_total_responses_sent')
      );
      const statsSuccessCount = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('stats_success_count')
      );
      const statsUniqueCounterparties = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('stats_unique_counterparties')
      );
      const statsLastInteractionAt = await logicDriver.ephemeralState.get(address, (builder) =>
        builder.entity('stats_last_interaction_at')
      );

      console.log(`   agent_id: ${formatValue(agentId)}`);
      console.log(`   interaction_counter: ${formatValue(interactionCounter)}`);
      console.log(`   interactions.length: ${formatValue(interactionsLen)}`);
      console.log(`   counterparties.length: ${formatValue(counterpartiesLen)}`);
      console.log(`   stats_total_requests_sent: ${formatValue(statsTotalRequestsSent)}`);
      console.log(`   stats_total_requests_received: ${formatValue(statsTotalRequestsReceived)}`);
      console.log(`   stats_total_responses_sent: ${formatValue(statsTotalResponsesSent)}`);
      console.log(`   stats_success_count: ${formatValue(statsSuccessCount)}`);
      console.log(`   stats_unique_counterparties: ${formatValue(statsUniqueCounterparties)}`);
      console.log(`   stats_last_interaction_at: ${formatValue(statsLastInteractionAt)}`);
    } catch (error) {
      console.error(`   ❌ Failed to read actor state: ${(error as Error).message}`);
    }
  }

  console.log('\n========================================');
  console.log('✅ Actor state inspection complete');
  console.log('========================================\n');
}

main().catch((error) => {
  console.error('\n❌ Script failed:');
  console.error(error);
  process.exit(1);
});

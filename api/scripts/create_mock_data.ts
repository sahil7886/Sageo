#!/usr/bin/env tsx
/**
 * Script to create mock agents on the deployed SageoIdentityLogic contract
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

// Mock agents matching the updated contract structure
const MOCK_AGENTS = [
  {
    name: "WeatherBot",
    description: "Provides weather updates and forecasts",
    version: "1.0.0",
    url: "https://weather.example.com",
    protocol_version: "0.3.0",
    default_input_modes: '["text","voice"]',
    default_output_modes: '["text"]',
    streaming: true,
    push_notifications: false,
    state_transition_history: false,
    icon_url: "https://weather.example.com/icon.png",
    documentation_url: "https://weather.example.com/docs",
    preferred_transport: "JSONRPC",
    skills: [
      {
        skill_id: "weather_forecast",
        skill_name: "Weather Forecast",
        skill_description: "Get weather forecasts for any location",
        skill_tags: "weather,forecast,prediction",
        skill_examples: '["What is the weather tomorrow?","Will it rain this weekend?"]',
        skill_input_modes: '["text"]',
        skill_output_modes: '["text"]'
      },
      {
        skill_id: "current_weather",
        skill_name: "Current Weather",
        skill_description: "Get current weather conditions",
        skill_tags: "weather,current,now",
        skill_examples: '["What is the weather now?","Is it raining?"]',
        skill_input_modes: '["text"]',
        skill_output_modes: '["text"]'
      }
    ]
  },
  {
    name: "StockTrader",
    description: "Analyzes stock market trends and provides trading insights",
    version: "2.1.0",
    url: "https://stocks.example.com",
    protocol_version: "0.3.0",
    default_input_modes: '["text","structured"]',
    default_output_modes: '["text","structured"]',
    streaming: true,
    push_notifications: true,
    state_transition_history: true,
    icon_url: "https://stocks.example.com/logo.png",
    documentation_url: "https://stocks.example.com/api",
    preferred_transport: "HTTP+JSON",
    skills: [
      {
        skill_id: "stock_analysis",
        skill_name: "Stock Analysis",
        skill_description: "Analyze stock performance and trends",
        skill_tags: "stocks,analysis,trading",
        skill_examples: '["Analyze AAPL stock","Show me TSLA trend"]',
        skill_input_modes: '["text"]',
        skill_output_modes: '["text","structured"]'
      },
      {
        skill_id: "portfolio_management",
        skill_name: "Portfolio Management",
        skill_description: "Manage and track investment portfolios",
        skill_tags: "portfolio,investment,tracking",
        skill_examples: '["Show my portfolio","Track my investments"]',
        skill_input_modes: '["text","structured"]',
        skill_output_modes: '["structured"]'
      }
    ]
  }
];

async function main(): Promise<boolean> {
  console.log('========================================');
  console.log('Sageo Mock Data Creation');
  console.log('Network: Devnet (Hardcoded)');
  console.log('========================================\n');

  if (!IDENTITY_LOGIC_ID) {
    console.error('❌ IDENTITY_LOGIC_ID is not set in moi-client.ts. Please deploy contracts first.');
    return false;
  }

  let hasFailures = false;

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

  // NOTE: Enlist is not required for RegisterAgent in SageoIdentityLogic
  // The contract doesn't check is_enlisted before allowing agent registration.
  // Also, the Enlist endpoint uses 'endpoint enlist dynamic' which requires 
  // a special interaction type that LogicDriver.routines may not handle correctly.

  // Get initial agent count to track sageo_ids
  let nextAgentNumber = 1;
  try {
    const countResult = await logicDriver.routines.GetAgentCount();
    // MOI SDK returns { output: { count: N }, error: null }
    const count = countResult?.output?.count ?? countResult?.count ?? 0;
    nextAgentNumber = count + 1;
    console.log(`📊 Current agent count: ${count}, next agent will be agent_${nextAgentNumber}`);
  } catch (err) {
    console.log('⚠️  Could not get current agent count, starting from 1');
  }

  for (const agent of MOCK_AGENTS) {
    console.log(`\nRegistering ${agent.name}...`);
    try {
      // Register the agent with the new parameter order
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
        address.toString(), // Ensure string format
        Math.floor(Date.now() / 1000) // Unix timestamp in seconds
      );

      console.log(`⏳ Waiting for confirmation... (Hash: ${ix.hash})`);
      const receipt = await ix.wait();

      // The sageo_id should be agent_N where N is the next agent number
      // We track this ourselves since the receipt contains POLO-encoded outputs
      const sageo_id = `agent_${nextAgentNumber}`;
      nextAgentNumber++;

      console.log(`✅ Registered ${agent.name} with sageo_id: ${sageo_id}`);

      // Add skills for this agent
      if (agent.skills) {
        for (const skill of agent.skills) {
          console.log(`   Adding skill: ${skill.skill_name}...`);
          try {
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
          } catch (error) {
            console.error(`   ❌ Failed to add skill ${skill.skill_name}:`, (error as Error).message);
            hasFailures = true;
          }
        }
      }

    } catch (error) {
      console.error(`❌ Failed to register ${agent.name}:`, (error as Error).message);
      hasFailures = true;
    }
  }

  // Verify registration
  console.log('\n📊 Verifying registration...');
  try {
    const countResult = await logicDriver.routines.GetAgentCount();
    // MOI SDK returns { output: { count: N }, error: null }
    const count = countResult?.output?.count ?? countResult?.count ?? 'unknown';
    console.log(`Total agents registered: ${count}`);

    const idsResult = await logicDriver.routines.GetAllAgentIds();
    // MOI SDK returns { output: { ids: [...] }, error: null }
    const ids = idsResult?.output?.ids ?? idsResult?.ids ?? [];
    console.log(`Agent IDs: ${JSON.stringify(ids)}`);

    if (ids.length === 0) {
      console.error('❌ No agents found after registration - this indicates a problem');
      hasFailures = true;
    }
  } catch (error) {
    console.error('❌ Failed to verify:', (error as Error).message);
    hasFailures = true;
  }

  return !hasFailures;
}

main()
  .then((success) => {
    if (success) {
      console.log('\n========================================');
      console.log('✨ Mock Data Creation SUCCESSFUL!');
      console.log('========================================\n');
      process.exit(0);
    } else {
      console.log('\n========================================');
      console.log('❌ Mock Data Creation FAILED');
      console.log('========================================\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });

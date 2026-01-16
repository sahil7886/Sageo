#!/usr/bin/env tsx
/**
 * Query existing agents on MOI to find WeatherBot and StockTrader
 */

import { SageoIdentitySDK } from '../src/index.js';
import {
  DEFAULT_IDENTITY_LOGIC_ID,
  DEFAULT_RPC_URL,
} from '../src/config.js';

async function queryExistingAgents() {
  console.log('========================================');
  console.log('Querying Existing Agents on MOI');
  console.log('========================================\n');

  try {
    // Initialize Identity SDK (read-only, no private key needed)
    const identitySDK = await SageoIdentitySDK.init({
      logicId: DEFAULT_IDENTITY_LOGIC_ID,
      manifest: 'identity' as any, // Will be loaded internally
      rpcUrl: DEFAULT_RPC_URL,
      privateKey: '', // No private key needed for read operations
    });

    // Get all agent IDs
    console.log('Fetching all registered agents...\n');
    
    // We need to use the readDriver directly to call GetAllAgentIds
    // But since we don't have a wallet, let's try a different approach
    // We'll use getAgentByUrl to find the specific agents
    
    const weatherUrl = 'https://weather.example.com';
    const stockUrl = 'https://stocks.example.com';

    console.log(`Looking for WeatherBot at: ${weatherUrl}`);
    const weatherProfile = await identitySDK.getAgentByUrl(weatherUrl);
    if (weatherProfile) {
      console.log(`✅ Found WeatherBot:`);
      console.log(`   - Sageo ID: ${weatherProfile.sageo_id}`);
      console.log(`   - Wallet Address: ${weatherProfile.wallet_address}`);
      console.log(`   - Status: ${weatherProfile.status}\n`);
      
      // Get full profile with card
      const fullProfile = await identitySDK.getAgentProfile(weatherProfile.sageo_id);
      if (fullProfile.found && fullProfile.profile) {
        console.log(`   - Name: ${fullProfile.profile.agent_card.name}`);
        console.log(`   - Description: ${fullProfile.profile.agent_card.description}`);
        console.log(`   - Skills: ${fullProfile.profile.agent_card.skills?.length || 0}\n`);
      }
    } else {
      console.log(`❌ WeatherBot not found\n`);
    }

    console.log(`Looking for StockTrader at: ${stockUrl}`);
    const stockProfile = await identitySDK.getAgentByUrl(stockUrl);
    if (stockProfile) {
      console.log(`✅ Found StockTrader:`);
      console.log(`   - Sageo ID: ${stockProfile.sageo_id}`);
      console.log(`   - Wallet Address: ${stockProfile.wallet_address}`);
      console.log(`   - Status: ${stockProfile.status}\n`);
      
      // Get full profile with card
      const fullProfile = await identitySDK.getAgentProfile(stockProfile.sageo_id);
      if (fullProfile.found && fullProfile.profile) {
        console.log(`   - Name: ${fullProfile.profile.agent_card.name}`);
        console.log(`   - Description: ${fullProfile.profile.agent_card.description}`);
        console.log(`   - Skills: ${fullProfile.profile.agent_card.skills?.length || 0}\n`);
      }
    } else {
      console.log(`❌ StockTrader not found\n`);
    }

    console.log('========================================');
    console.log('Query Complete');
    console.log('========================================\n');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

queryExistingAgents();

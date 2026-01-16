/**
 * MOI Devnet Faucet Integration
 * Provides functionality to fund wallets for testing purposes
 * 
 * Requires VOYAGE_API_KEY environment variable to be set.
 * Get your API key from: https://voyage.moi.technology/
 */

import axios from 'axios';

const FAUCET_BASE_URL = 'https://api-voyage.moibit.io/api/rpc/babylon/v2/faucet';
const FAUCET_API_KEY = 'PD3YTIsSPnB2obO13yqO-LjPQhcte2C3';
const FAUCET_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

interface FaucetResponse {
  success?: boolean;
  message?: string;
  hash?: string;
  error?: string;
}

/**
 * Fund a wallet using the MOI devnet faucet
 * @param address - The wallet address to fund
 * @throws Error if funding fails after retries
 */
export async function fundWallet(address: string): Promise<void> {
  // Check if API key is configured
  if (!FAUCET_API_KEY) {
    throw new Error(
      'VOYAGE_API_KEY environment variable is not set.\n' +
      'Get your API key from https://voyage.moi.technology/ and set it in your .env file:\n' +
      'VOYAGE_API_KEY=your_api_key_here'
    );
  }

  const faucetUrl = `${FAUCET_BASE_URL}/${FAUCET_API_KEY}/claim`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🚰 Funding wallet ${address} (attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await axios.post<FaucetResponse>(
        faucetUrl,
        { address },
        {
          timeout: FAUCET_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success || response.data.hash) {
        console.log(`✅ Successfully funded wallet ${address}`);
        if (response.data.hash) {
          console.log(`   Transaction hash: ${response.data.hash}`);
        }
        return;
      } else {
        throw new Error(response.data.message || response.data.error || 'Unknown faucet error');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          console.warn(`⚠️  Rate limited by faucet, waiting before retry...`);
        } else if (error.code === 'ECONNABORTED') {
          console.warn(`⚠️  Faucet request timed out, retrying...`);
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Invalid VOYAGE_API_KEY. Please check your API key from https://voyage.moi.technology/');
        } else {
          console.warn(`⚠️  Faucet request failed: ${error.message}`);
        }
      } else {
        console.warn(`⚠️  Error funding wallet: ${lastError.message}`);
      }

      // Wait before retrying (except on last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to fund wallet ${address} after ${MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Transfer tokens from one wallet to another
 * @param fromWallet - Source wallet (must be connected to provider)
 * @param toAddress - Destination address
 * @param amount - Amount to transfer in smallest unit (default: 10000 = 10k tokens)
 */
export async function transferTokens(
  fromWallet: any,
  toAddress: string,
  amount: number = 10000
): Promise<void> {
  try {
    console.log(`💸 Transferring ${amount} tokens to ${toAddress}...`);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:105', message: 'Transfer start', data: { toAddress, amount, walletAddress: fromWallet.getIdentifier() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H1' }) }).catch(() => { });
    // #endregion

    // CRITICAL: Check wallet state BEFORE attempting transfer
    const provider = fromWallet.provider || fromWallet._provider;
    let walletState;
    try {
      const nonce = await fromWallet.getNonce();
      const pendingCount = await provider.getPendingInteractionCount(fromWallet.getIdentifier());
      const interactionCount = await provider.getInteractionCount(fromWallet.getIdentifier());

      walletState = {
        nonce,
        pendingCount: typeof pendingCount === 'bigint' ? Number(pendingCount) : pendingCount,
        interactionCount: typeof interactionCount === 'bigint' ? Number(interactionCount) : interactionCount
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:120', message: 'Wallet state before transfer', data: walletState, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H8' }) }).catch(() => { });
      // #endregion

      console.log(`📊 Wallet nonce: ${nonce}, pending: ${walletState.pendingCount}, confirmed: ${walletState.interactionCount}`);
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:129', message: 'Failed to get wallet state', data: { error: String(e) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H8' }) }).catch(() => { });
      // #endregion
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:144', message: 'Sending with SDK auto-nonce', data: { toAddress, type: 2 }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H15' }) }).catch(() => { });
    // #endregion

    // Create ASSET_TRANSFER - NO NONCE, let SDK auto-manage completely
    const tx = await fromWallet.sendInteraction({
      fuel_price: 1,
      fuel_limit: 200,
      // NO nonce field - SDK will auto-manage
      ix_operations: [{
        type: 2, // ASSET_TRANSFER - correct type!
        payload: {
          beneficiary: toAddress,
          asset_id: '0x108000004cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000',
          amount: amount
        }
      }]
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:126', message: 'Transaction sent', data: { txHash: tx.hash }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H1' }) }).catch(() => { });
    // #endregion

    // Wait for transaction to be confirmed on-chain
    const receipt = await tx.wait();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:133', message: 'Transaction confirmed', data: { txHash: tx.hash, status: receipt?.status }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H7' }) }).catch(() => { });
    // #endregion

    console.log(`✅ Transfer complete (status: ${receipt?.status})`);
  } catch (error) {
    // #region agent log
    const err = error as any;
    const errorDetails = {
      message: err?.message || String(error),
      code: err?.code,
      reason: err?.reason,
      params: err?.params,
      errorType: err?.constructor?.name,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error as object))
    };
    fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:163', message: 'Transfer failed with details', data: errorDetails, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H4' }) }).catch(() => { });
    // #endregion

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to transfer tokens: ${errorMessage}`);
  }
}

/**
 * Distribute tokens from distributor wallet to multiple target wallets
 * Assumes distributor wallet already has sufficient balance (no faucet call)
 * 
 * @param distributorWallet - Wallet to distribute from (must be connected to provider and have sufficient balance)
 * @param targetAddresses - Array of addresses to fund
 * @param amountPerWallet - Amount to send to each wallet (default: 10000 = 10k tokens)
 * @returns Array of results indicating success/failure for each address
 */
export async function distributeTokens(
  distributorWallet: any,
  targetAddresses: string[],
  amountPerWallet: number = 10000
): Promise<{ address: string; success: boolean; error?: string }[]> {
  const results: { address: string; success: boolean; error?: string }[] = [];
  const totalNeeded = targetAddresses.length * amountPerWallet;
  const distributorAddress = distributorWallet.getIdentifier();

  // Check if distributor has sufficient balance
  console.log('\n💰 Checking distributor wallet balance...');
  try {
    const provider = distributorWallet.provider || distributorWallet._provider;

    if (!provider) {
      throw new Error('Wallet is not connected to a provider. Cannot check balance.');
    }

    const nativeAssetId = '0x108000004cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000';
    const balanceResult = await provider.getBalance(distributorAddress, nativeAssetId);
    const currentBalance = typeof balanceResult === 'bigint' ? Number(balanceResult) : parseInt(balanceResult?.toString() || '0');

    console.log(`📊 Current balance: ${currentBalance} tokens`);
    console.log(`📊 Required: ${totalNeeded} tokens`);

    if (currentBalance < totalNeeded) {
      throw new Error(
        `Insufficient balance: ${currentBalance} tokens available, need ${totalNeeded} tokens.\n` +
        `Please fund the deployer wallet (${distributorAddress}) manually or use --faucet flag.`
      );
    }

    console.log(`✅ Sufficient balance available\n`);
  } catch (error) {
    throw error;
  }

  // Distribute to each target wallet
  console.log(`💸 Distributing ${amountPerWallet} tokens to ${targetAddresses.length} wallet(s)...\n`);

  for (const address of targetAddresses) {
    try {
      await transferTokens(distributorWallet, address, amountPerWallet);
      results.push({ address, success: true });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a93a6bdf-b6d1-48e8-a64c-8aa46cc7965d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'faucet.ts:227', message: 'Transfer successful, adding longer delay', data: { address }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'transfer-test', hypothesisId: 'H7' }) }).catch(() => { });
      // #endregion

      // Add longer delay between transactions to ensure blockchain state updates
      // Transaction is confirmed, but we need extra time for state propagation
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to fund ${address}: ${errorMessage}`);
      results.push({ address, success: false, error: errorMessage });
    }
  }

  return results;
}

/**
 * Fund multiple wallets using distributor pattern WITH faucet
 * 1. Attempts to fund distributor wallet via faucet
 * 2. If faucet fails, checks if existing balance is sufficient
 * 3. Distributor transfers tokens to each target wallet
 * 
 * @param distributorWallet - Wallet to receive faucet funds and distribute (must be connected to provider)
 * @param targetAddresses - Array of addresses to fund
 * @param amountPerWallet - Amount to send to each wallet (default: 10000 = 10k tokens)
 * @returns Array of results indicating success/failure for each address
 */
export async function fundWalletsViaDistributor(
  distributorWallet: any,
  targetAddresses: string[],
  amountPerWallet: number = 10000
): Promise<{ address: string; success: boolean; error?: string }[]> {
  const results: { address: string; success: boolean; error?: string }[] = [];
  const totalNeeded = targetAddresses.length * amountPerWallet;
  const distributorAddress = distributorWallet.getIdentifier();

  // Step 1: Attempt to fund distributor wallet via faucet
  console.log('\n💰 Step 1: Funding distributor wallet via faucet...');
  try {
    await fundWallet(distributorAddress);
    console.log('✅ Distributor wallet funded (100k tokens)\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Faucet failed: ${errorMessage}`);

    // Step 2: Check if existing balance is sufficient
    console.log('\n📊 Checking if existing balance is sufficient...');
    try {
      // Get the provider from the wallet
      const provider = distributorWallet.provider || distributorWallet._provider;

      if (!provider) {
        throw new Error('Wallet is not connected to a provider. Cannot check balance.');
      }

      // Get balance using provider.getBalance(address, assetId)
      // Native MOI token asset ID
      const nativeAssetId = '0x108000004cd973c4eb83cdb8870c0de209736270491b7acc99873da100000000';
      const balanceResult = await provider.getBalance(distributorAddress, nativeAssetId);
      const currentBalance = typeof balanceResult === 'bigint' ? Number(balanceResult) : parseInt(balanceResult?.toString() || '0');

      console.log(`   Current balance: ${currentBalance} tokens`);
      console.log(`   Required: ${totalNeeded} tokens`);

      if (currentBalance >= totalNeeded) {
        console.log(`✅ Existing balance is sufficient, continuing...\n`);
      } else {
        throw new Error(
          `Insufficient balance (${currentBalance} tokens) and faucet failed. ` +
          `Need ${totalNeeded} tokens to fund ${targetAddresses.length} wallet(s).`
        );
      }
    } catch (balanceError) {
      if (balanceError instanceof Error && balanceError.message.includes('Insufficient balance')) {
        throw balanceError;
      }
      throw new Error(`Cannot verify distributor balance: ${balanceError}`);
    }
  }

  // Step 3: Distribute to each target wallet
  console.log(`💸 Step 2: Distributing ${amountPerWallet} tokens to ${targetAddresses.length} wallet(s)...\n`);

  for (const address of targetAddresses) {
    try {
      await transferTokens(distributorWallet, address, amountPerWallet);
      results.push({ address, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to fund ${address}: ${errorMessage}`);
      results.push({ address, success: false, error: errorMessage });
    }
  }

  return results;
}

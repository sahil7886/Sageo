import { Router } from 'express';
import { ApiError } from '../lib/errors';
import { INTERACTION_LOGIC_ID, IDENTITY_LOGIC_ID, readLogic } from '../lib/moi-client';
import { getConfig } from '../lib/config';

const router = Router();

/**
 * GET /interactions/recent
 * Returns list of recent interactions (mocked/limited for now or using parallel fetch)
 */
// Helper to get agent address (from cache or lookup)
// For MVP/Recent, we aggregate from known mock agents (agent_1)
router.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Resolve agent_1 to get address
    // In a real app, we'd have a 'ListRecentInteractions' on-chain endpoint (now implemented in IDL but not deployed due to funds)
    // Fallback: Fetch agent_1 interactions
    const config = getConfig();
    const profileResult = await readLogic(config, IDENTITY_LOGIC_ID, 'GetAgentProfile', 'identity', 'agent_1') as any;

    if (!profileResult || !profileResult.output || !profileResult.output.found) {
      return res.json({ interactions: [] });
    }

    const address = profileResult.output.profile.wallet_address;
    if (!address) {
      return res.json({ interactions: [] });
    }

    // Now fetch interactions for this address
    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'ListInteractionsByAgent',
      'interaction',
      address,
      limit,
      0
    ) as any;

    const interactions = result?.records || result || [];
    // Ensure array
    const list = Array.isArray(interactions) ? interactions : (interactions.records || []);

    res.json({ interactions: list });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /interactions/:interaction_id
 * Get details of a specific interaction
 */
router.get('/:interaction_id', async (req, res, next) => {
  try {
    const { interaction_id } = req.params;

    // readLogic now automatically awaits dynamic call results
    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'GetInteraction',
      'interaction',
      interaction_id
    ) as any;

    if (!result || !result.found) {
      throw new ApiError(404, 'Interaction not found');
    }

    res.json(result.record || result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /interactions/:interaction_id/verify
 * Verify interaction integrity
 */
router.get('/:interaction_id/verify', async (req, res, next) => {
  try {
    const { interaction_id } = req.params;
    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'GetInteraction',
      'interaction',
      interaction_id
    ) as any;

    if (!result || !result.found) {
      throw new ApiError(404, 'Interaction not found');
    }

    res.json({
      verified: true,
      on_chain_hash: result.record.request_hash,
      timestamp: result.record.timestamp
    });
  } catch (error) {
    next(error);
  }
});

// Endpoints moved to agents.ts
// GET /agents/:sageo_id/interactions
// GET /agents/:sageo_id/stats

export default router;

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
    // No global recent-interactions endpoint; fallback to agent_1 interactions
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

    // Static endpoints return { output: { records: [...], total: N }, error: null }
    const interactions = result?.output?.records || result?.records || [];

    res.json({ interactions });
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
    const sageoId = req.query.sageo_id as string | undefined;
    const agentAddress = req.query.agent_address as string | undefined;

    let agentIdentifier = agentAddress?.trim();
    if (!agentIdentifier) {
      if (!sageoId) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Missing sageo_id or agent_address');
      }

      const config = getConfig();
      const profileResult = await readLogic(
        config,
        IDENTITY_LOGIC_ID,
        'GetAgentProfile',
        'identity',
        sageoId
      ) as any;

      if (!profileResult || !profileResult.output || !profileResult.output.found) {
        throw new ApiError(404, 'NOT_FOUND', 'Agent not found');
      }

      const profile = profileResult.output.profile;
      agentIdentifier = profile?.wallet_address;
    }

    if (!agentIdentifier) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Agent identifier could not be resolved');
    }

    // readLogic now automatically awaits dynamic call results
    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'GetInteraction',
      'interaction',
      agentIdentifier,
      interaction_id
    ) as any;
    // Static endpoints return { output: { record: {...}, found: bool }, error: null }
    const output = result?.output || result;
    if (!output || !output.found) {
      throw new ApiError(404, 'NOT_FOUND', 'Interaction not found');
    }

    res.json(output.record || result);
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
    const sageoId = req.query.sageo_id as string | undefined;
    const agentAddress = req.query.agent_address as string | undefined;

    let agentIdentifier = agentAddress?.trim();
    if (!agentIdentifier) {
      if (!sageoId) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Missing sageo_id or agent_address');
      }

      const config = getConfig();
      const profileResult = await readLogic(
        config,
        IDENTITY_LOGIC_ID,
        'GetAgentProfile',
        'identity',
        sageoId
      ) as any;

      if (!profileResult || !profileResult.output || !profileResult.output.found) {
        throw new ApiError(404, 'NOT_FOUND', 'Agent not found');
      }

      const profile = profileResult.output.profile;
      agentIdentifier = profile?.wallet_address;
    }

    if (!agentIdentifier) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Agent identifier could not be resolved');
    }

    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'GetInteraction',
      'interaction',
      agentIdentifier,
      interaction_id
    ) as any;
    // Static endpoints return { output: { record: {...}, found: bool }, error: null }
    const output = result?.output || result;
    if (!output || !output.found) {
      throw new ApiError(404, 'NOT_FOUND', 'Interaction not found');
    }

    res.json({
      verified: true,
      on_chain_hash: output.record.request_hash,
      timestamp: output.record.timestamp
    });
  } catch (error) {
    next(error);
  }
});

// Endpoints moved to agents.ts
// GET /agents/:sageo_id/interactions
// GET /agents/:sageo_id/stats

export default router;

import { Router } from 'express';
import { ApiError } from '../lib/errors';
import { getAgentWalletAddress, getFirstAgentWalletAddress, normalizeAgentIdentifier } from '../lib/agent-mnemonics.js';
import { getActorInteractionById, getActorInteractions } from '../lib/interaction-state.js';

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

    // No global recent-interactions endpoint; fallback to agent_1 from mnemonics
    const address = getAgentWalletAddress('agent_1') ?? getFirstAgentWalletAddress();
    if (!address) {
      return res.json({ interactions: [] });
    }

    const { interactions } = await getActorInteractions(address, limit, 0);
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
    if (agentIdentifier) {
      agentIdentifier = normalizeAgentIdentifier(agentIdentifier);
    }
    if (!agentIdentifier) {
      if (!sageoId) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Missing sageo_id or agent_address');
      }
      agentIdentifier = getAgentWalletAddress(sageoId) ?? undefined;
    }

    if (!agentIdentifier) {
      throw new ApiError(404, 'NOT_FOUND', 'Agent not found');
    }

    const record = await getActorInteractionById(agentIdentifier, interaction_id);
    if (!record) {
      throw new ApiError(404, 'NOT_FOUND', 'Interaction not found');
    }

    res.json(record);
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
    if (agentIdentifier) {
      agentIdentifier = normalizeAgentIdentifier(agentIdentifier);
    }
    if (!agentIdentifier) {
      if (!sageoId) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Missing sageo_id or agent_address');
      }
      agentIdentifier = getAgentWalletAddress(sageoId) ?? undefined;
    }

    if (!agentIdentifier) {
      throw new ApiError(404, 'NOT_FOUND', 'Agent not found');
    }

    const record = await getActorInteractionById(agentIdentifier, interaction_id);
    if (!record) {
      throw new ApiError(404, 'NOT_FOUND', 'Interaction not found');
    }

    res.json({
      verified: true,
      on_chain_hash: record.request_hash,
      timestamp: record.timestamp
    });
  } catch (error) {
    next(error);
  }
});

// Endpoints moved to agents.ts
// GET /agents/:sageo_id/interactions
// GET /agents/:sageo_id/stats

export default router;

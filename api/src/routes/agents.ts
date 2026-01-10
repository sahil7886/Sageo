import { Router, Request, Response, NextFunction } from 'express';
import { requireContract } from '../lib/deps.js';
import { validateSageoId } from '../lib/validate.js';
import { NotFoundError, ApiError } from '../lib/errors.js';
import { readLogic } from '../lib/moi-client.js';
import { getConfig } from '../lib/config.js';

const router = Router();

// Placeholder routes - will be implemented later
router.get('/', (req, res) => {
  requireContract('identity');
  res.json([]);
});

router.get('/search', (req, res) => {
  requireContract('identity');
  res.json([]);
});

router.get('/by-skill/:skill_id', (req, res) => {
  requireContract('identity');
  res.json([]);
});

router.get('/by-url', (req, res) => {
  requireContract('identity');
  res.json(null);
});

// GET /:sageo_id/ping - Ping endpoint for agent (must come before /:sageo_id/card and /:sageo_id)
router.get('/:sageo_id/ping', (req: Request, res: Response) => {
  res.json({ ok: true, sageo_id: req.params.sageo_id });
});

// GET /:sageo_id/card - Get agent card with skills
// Note: Due to Cocolang limitation, skills are fetched separately and merged
router.get('/:sageo_id/card', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sageo_id = validateSageoId(req.params.sageo_id);
    const identityAddress = requireContract('identity');
    const config = getConfig();

    // Fetch card and skills in parallel
    const [cardResult, skillsResult] = await Promise.all([
      readLogic(config, identityAddress, 'GetAgentCard', 'identity', sageo_id),
      readLogic(config, identityAddress, 'GetAgentSkills', 'identity', sageo_id)
    ]);

    // Process card result
    const cardData = cardResult as any;
    if (cardData.error && cardData.error.error === 'map key does not exist') {
      throw new NotFoundError('Agent');
    }
    if (cardData.output && cardData.output.found === false) {
      throw new NotFoundError('Agent');
    }

    // Extract card
    let card: any;
    if (cardData.output && cardData.output.card) {
      card = cardData.output.card;
    } else if (cardData.card) {
      card = cardData.card;
    } else {
      card = cardData;
    }

    // Extract skills and merge into card
    const skillsData = skillsResult as any;
    if (skillsData.output && skillsData.output.skills) {
      card.skills = skillsData.output.skills;
    } else if (skillsData.skills) {
      card.skills = skillsData.skills;
    }

    res.status(200).json(card);
  } catch (error) {
    next(error);
  }
});

// GET /:sageo_id - Get agent profile metadata by ID (must come after /:sageo_id/card)
router.get('/:sageo_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate sageo_id
    const sageo_id = validateSageoId(req.params.sageo_id);

    // Require identity contract (throws 501 if missing)
    const identityAddress = requireContract('identity');

    // Get config for RPC URL
    const config = getConfig();

    // Call identity contract method GetAgentProfile (returns metadata without agent_card)
    let result: unknown;
    try {
      result = await readLogic(config, identityAddress, 'GetAgentProfile', 'identity', sageo_id);
    } catch (error) {
      // Re-throw ApiError as-is, wrap others
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        'CHAIN_ERROR',
        `Failed to read from identity contract: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Handle null/not found - check if result is null, undefined, or an invalid response
    if (result === null || result === undefined) {
      throw new NotFoundError('Agent');
    }

    // Ensure result is an object (type-safe guard for malformed contract response)
    if (typeof result !== 'object' || result === null || Array.isArray(result)) {
      throw new ApiError(
        500,
        'CHAIN_ERROR',
        'Invalid response format from identity contract'
      );
    }

    // Extract profile from result
    // Result format: { output: { profile: {...}, found: true }, error: null }
    // Or on error: { output: null, error: { class: "...", error: "map key does not exist" } }
    const data = result as any;

    // Check for contract error (agent not found)
    if (data.error && data.error.error === 'map key does not exist') {
      throw new NotFoundError('Agent');
    }

    if (data.output && data.output.found === false) {
      throw new NotFoundError('Agent');
    }

    if (data.output && data.output.profile) {
      res.status(200).json(data.output.profile);
    } else if (data.profile) {
      res.status(200).json(data.profile);
    } else {
      // Fallback if structure is different
      res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
});

router.get('/:sageo_id/interactions', (req, res) => {
  requireContract('interaction');
  res.json([]);
});

router.get('/:sageo_id/stats', (req, res) => {
  requireContract('interaction');
  res.json(null);
});

export default router;


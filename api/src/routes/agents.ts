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

// GET /:sageo_id/card - Get agent card only (must come before /:sageo_id)
router.get('/:sageo_id/card', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate sageo_id
    const sageo_id = validateSageoId(req.params.sageo_id);

    // Require identity contract (throws 501 if missing)
    const identityAddress = requireContract('identity');

    // Get config for RPC URL
    const config = getConfig();

    // Call identity contract method GetAgentCard
    let result: unknown;
    try {
      result = await readLogic(config, identityAddress, 'GetAgentCard', 'identity', sageo_id);
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

    // Handle null/not found
    if (result === null || result === undefined) {
      throw new NotFoundError('Agent');
    }

    // Ensure result is an object
    if (typeof result !== 'object' || result === null || Array.isArray(result)) {
      throw new ApiError(
        500,
        'CHAIN_ERROR',
        'Invalid response format from identity contract'
      );
    }

    // Since GetAgentCard returns the card directly (wrapped in result), we just return it
    // The previous logic expected a profile wrapper
    // The result from SDK is actually { output: { card: ..., found: true }, error: null }
    // Or sometimes directly the output if unwrapped.
    // The previous logs showed: {"output":{"card":{...},"found":true},"error":null}
    const data = result as any;
    
    if (data.output && data.output.card) {
        res.status(200).json(data.output.card);
    } else if (data.card) {
        res.status(200).json(data.card);
    } else {
        // Fallback if structure is different
        res.status(200).json(result);
    }
  } catch (error) {
    next(error);
  }
});

// GET /:sageo_id - Get agent profile by ID (must come after /:sageo_id/card)
router.get('/:sageo_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate sageo_id
    const sageo_id = validateSageoId(req.params.sageo_id);

    // Require identity contract (throws 501 if missing)
    const identityAddress = requireContract('identity');

    // Get config for RPC URL
    const config = getConfig();

    // Call identity contract method GetAgentById
    let result: unknown;
    try {
      result = await readLogic(config, identityAddress, 'GetAgentById', 'identity', sageo_id);
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

    // Return agent profile JSON as-is
    res.status(200).json(result);
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


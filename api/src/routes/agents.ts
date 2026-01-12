import { Router, Request, Response, NextFunction } from 'express';
import { requireContract } from '../lib/deps.js';
import { validateSageoId } from '../lib/validate.js';
import { NotFoundError, ApiError } from '../lib/errors.js';
import { readLogic } from '../lib/moi-client.js';
import { getConfig } from '../lib/config.js';

const router = Router();

// Helper: Fetch complete agent profile with card and skills
async function fetchFullAgentProfile(sageoId: string, identityAddress: string, config: any): Promise<any> {
  const [profileResult, cardResult, skillsResult] = await Promise.all([
    readLogic(config, identityAddress, 'GetAgentProfile', 'identity', sageoId),
    readLogic(config, identityAddress, 'GetAgentCard', 'identity', sageoId),
    readLogic(config, identityAddress, 'GetAgentSkills', 'identity', sageoId)
  ]);

  const profileData = profileResult as any;
  const cardData = cardResult as any;
  const skillsData = skillsResult as any;

  // Check for not found
  if (profileData.error?.error === 'map key does not exist') return null;
  if (profileData.output?.found === false) return null;

  // Extract profile
  const profile = profileData.output?.profile ?? profileData.profile ?? profileData;

  // Extract and merge card with skills
  let card = cardData.output?.card ?? cardData.card ?? cardData;
  const skills = skillsData.output?.skills ?? skillsData.skills ?? [];
  card = { ...card, skills };

  return { ...profile, agent_card: card };
}

// Helper: Simple fuzzy match score (case-insensitive contains)
function fuzzyScore(text: string, query: string): number {
  if (!text || !query) return 0;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 100;
  if (lower.includes(q)) return 50 + (q.length / lower.length) * 30;
  // Check word matches
  const words = q.split(/\s+/);
  let score = 0;
  for (const w of words) {
    if (lower.includes(w)) score += 20;
  }
  return score;
}

// GET /agents - List agents with filtering and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identityAddress = requireContract('identity');
    const config = getConfig();

    // Parse query params
    const status = req.query.status as string | undefined;
    const streaming = req.query.streaming as string | undefined;
    const tags = req.query.tags as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Fetch all agent IDs
    const idsResult = await readLogic(config, identityAddress, 'GetAllAgentIds', 'identity') as any;
    const ids: string[] = idsResult?.output?.ids ?? idsResult?.ids ?? [];

    // Fetch all agent profiles in parallel
    const profilePromises = ids.map(id => fetchFullAgentProfile(id, identityAddress, config));
    const allProfiles = (await Promise.all(profilePromises)).filter(p => p !== null);

    // Apply filters
    let filtered = allProfiles;

    if (status) {
      filtered = filtered.filter(p => p.status === status.toUpperCase());
    }

    if (streaming !== undefined) {
      const wantStreaming = streaming === 'true';
      filtered = filtered.filter(p => p.agent_card?.capabilities?.streaming === wantStreaming);
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      filtered = filtered.filter(p => {
        const skills = p.agent_card?.skills ?? [];
        return skills.some((s: any) => {
          const skillTags = (s.tags || '').toLowerCase().split(',').map((t: string) => t.trim());
          return tagList.some(t => skillTags.includes(t));
        });
      });
    }

    // Pagination
    const paginated = filtered.slice(offset, offset + limit);

    res.json(paginated);
  } catch (error) {
    next(error);
  }
});

// GET /agents/search - Search agents by query
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identityAddress = requireContract('identity');
    const config = getConfig();

    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Fetch all agents
    const idsResult = await readLogic(config, identityAddress, 'GetAllAgentIds', 'identity') as any;
    const ids: string[] = idsResult?.output?.ids ?? idsResult?.ids ?? [];

    const profilePromises = ids.map(id => fetchFullAgentProfile(id, identityAddress, config));
    const allProfiles = (await Promise.all(profilePromises)).filter(p => p !== null);

    // Score and rank by relevance
    const scored = allProfiles.map(p => {
      let score = 0;
      score += fuzzyScore(p.agent_card?.name || '', q);
      score += fuzzyScore(p.agent_card?.description || '', q) * 0.8;

      // Check skills
      const skills = p.agent_card?.skills ?? [];
      for (const s of skills) {
        score += fuzzyScore(s.name || '', q) * 0.6;
        score += fuzzyScore(s.description || '', q) * 0.4;
        score += fuzzyScore(s.tags || '', q) * 0.5;
      }
      return { profile: p, score };
    });

    // Filter out zero scores and sort by score descending
    const results = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.profile);

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /agents/by-skill/:skill_id - Find agents by skill ID
router.get('/by-skill/:skill_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identityAddress = requireContract('identity');
    const config = getConfig();
    const skillId = req.params.skill_id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    // Fetch all agents
    const idsResult = await readLogic(config, identityAddress, 'GetAllAgentIds', 'identity') as any;
    const ids: string[] = idsResult?.output?.ids ?? idsResult?.ids ?? [];

    const profilePromises = ids.map(id => fetchFullAgentProfile(id, identityAddress, config));
    const allProfiles = (await Promise.all(profilePromises)).filter(p => p !== null);

    // Filter by skill ID
    const matching = allProfiles.filter(p => {
      const skills = p.agent_card?.skills ?? [];
      return skills.some((s: any) => s.id === skillId);
    });

    res.json(matching.slice(0, limit));
  } catch (error) {
    next(error);
  }
});

// GET /agents/by-url - Find agent by URL
router.get('/by-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identityAddress = requireContract('identity');
    const config = getConfig();
    const url = req.query.url as string;

    if (!url) {
      return res.status(400).json({ error: 'Query parameter "url" is required' });
    }

    // Call contract method GetAgentByUrl
    const result = await readLogic(config, identityAddress, 'GetAgentByUrl', 'identity', url) as any;

    // Check for not found
    if (result.error?.error === 'map key does not exist') {
      return res.json(null);
    }
    if (result.output?.found === false) {
      return res.json(null);
    }

    // Extract sageo_id from profile and fetch full profile
    const profile = result.output?.profile ?? result.profile ?? result;
    if (profile?.sageo_id) {
      const fullProfile = await fetchFullAgentProfile(profile.sageo_id, identityAddress, config);
      return res.json(fullProfile);
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
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

// GET /:sageo_id/interactions - List interactions involving a specific agent
router.get('/:sageo_id/interactions', async (req, res, next) => {
  try {
    const sageo_id = validateSageoId(req.params.sageo_id);
    const { INTERACTION_LOGIC_ID } = await import('../lib/moi-client.js');
    const { getConfig } = await import('../lib/config.js');
    const { requireContract } = await import('../lib/deps.js');

    if (!INTERACTION_LOGIC_ID) {
      return res.json({ interactions: [], total: 0, limit: 0, offset: 0 });
    }

    // Resolve SageoID to Address via IdentityLogic
    const identityAddress = requireContract('identity');
    const config = getConfig();
    const profileResult = await readLogic(config, identityAddress, 'GetAgentProfile', 'identity', sageo_id) as any;

    // Check if agent exists
    if (!profileResult || profileResult.error || (profileResult.output && !profileResult.output.found)) {
      // Agent not found -> empty interactions
      return res.json({ interactions: [], total: 0, limit: 0, offset: 0 });
    }

    // Extract address. Profile struct has wallet_address
    const profile = profileResult.output?.profile ?? profileResult.profile;
    const agentAddress = profile?.wallet_address;

    if (!agentAddress) {
      return res.json({ interactions: [], total: 0, limit: 0, offset: 0 });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'ListInteractionsByAgent',
      'interaction',
      agentAddress,
      limit,
      offset,
      { fuelLimit: 100000, fuelPrice: 1 }
    ) as any;

    // result: { records: [...], total: ... }
    const interactions = result?.records || [];
    const total = result?.total || 0;

    res.json({
      interactions,
      total: Number(total),
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
});

// GET /:sageo_id/stats - Get interaction statistics for an agent
router.get('/:sageo_id/stats', async (req, res, next) => {
  try {
    const sageo_id = validateSageoId(req.params.sageo_id);
    const { INTERACTION_LOGIC_ID } = await import('../lib/moi-client.js');
    const { getConfig } = await import('../lib/config.js');
    const { requireContract } = await import('../lib/deps.js');

    if (!INTERACTION_LOGIC_ID) {
      return res.json({ stats: null });
    }

    // Resolve SageoID to Address
    const identityAddress = requireContract('identity');
    const config = getConfig();
    const profileResult = await readLogic(config, identityAddress, 'GetAgentProfile', 'identity', sageo_id) as any;

    if (!profileResult || profileResult.error || (profileResult.output && !profileResult.output.found)) {
      return res.json({ stats: null });
    }

    const profile = profileResult.output?.profile ?? profileResult.profile;
    const agentAddress = profile?.wallet_address;

    if (!agentAddress) {
      return res.json({ stats: null });
    }

    const result = await readLogic(
      null,
      INTERACTION_LOGIC_ID,
      'GetAgentInteractionStats',
      'interaction',
      agentAddress
    ) as any;

    if (!result || !result.found) {
      return res.json({
        stats: {
          total_requests_sent: 0,
          total_requests_received: 0,
          total_responses_sent: 0,
          success_count: 0,
          unique_counterparties: 0,
          last_interaction_at: 0
        }
      });
    }

    res.json({ stats: result.stats });
  } catch (error) {
    next(error);
  }
});

export default router;


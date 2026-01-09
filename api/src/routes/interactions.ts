import { Router } from 'express';
import { requireContract } from '../lib/deps.js';

const router = Router();

// Base path - check contract configuration
router.get('/', (req, res) => {
  requireContract('interaction');
  res.json({ ok: true });
});

// Ping endpoint
router.get('/ping', (req, res) => {
  res.json({ ok: true, route: 'interactions' });
});

// Placeholder routes - will be implemented later
// Note: These must come after specific routes like /ping
router.get('/:interaction_id', (req, res) => {
  requireContract('interaction');
  res.json(null);
});

router.get('/:interaction_id/verify', (req, res) => {
  requireContract('interaction');
  res.json({ valid: false });
});

export default router;


import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getBulkPresence } from '../services/presence.js';

const router = Router();

router.use(requireAuth);

/**
 * POST /api/presence
 * Returns presence status for a list of user IDs.
 * Body: { userIds: string[] }
 */
router.post('/', async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }

    if (userIds.length > 100) {
      return res.status(400).json({ error: 'Cannot request more than 100 users at once' });
    }

    const presence = await getBulkPresence(userIds);
    res.json({ presence });
  } catch (err) {
    next(err);
  }
});

export default router;
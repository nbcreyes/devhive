import { Router } from 'express';
import { getChannelSummary } from '../controllers/summaryController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/summary', getChannelSummary);

export default router;
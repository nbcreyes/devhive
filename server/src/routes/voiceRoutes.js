import { Router } from 'express';
import { getVoiceToken } from '../controllers/voiceController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/:channelId/token', getVoiceToken);

export default router;
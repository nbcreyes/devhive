import { Router } from 'express';
import { executeCode } from '../controllers/executionController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.post('/', requireAuth, executeCode);

export default router;
import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', search);

export default router;
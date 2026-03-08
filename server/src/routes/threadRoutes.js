import { Router } from 'express';
import {
  getThreads,
  createThread,
  editThread,
  deleteThread,
} from '../controllers/threadController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getThreads);
router.post('/', createThread);
router.patch('/:threadId', editThread);
router.delete('/:threadId', deleteThread);

export default router;
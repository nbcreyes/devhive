import { Router } from 'express';
import {
  getDirectMessages,
  getConversations,
  deleteDirectMessage,
  editDirectMessage,
} from '../controllers/dmController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/conversations', getConversations);
router.get('/:userId', getDirectMessages);
router.patch('/:messageId', editDirectMessage);
router.delete('/:messageId', deleteDirectMessage);

export default router;